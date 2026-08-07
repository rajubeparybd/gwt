import {Args, Command, Flags} from '@oclif/core'
import {execa} from 'execa'
import inquirer from 'inquirer'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import ora from 'ora'
import {simpleGit, SimpleGit} from 'simple-git'
import {DEFAULT_CONFIG, loadConfig} from '../config.js'

interface Worktree {
  branch: string
  path: string
}

export default class Rm extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to remove'}),
  }
  static override description = 'Remove a git worktree and its branch'
  static override flags = {
    archive: Flags.boolean({char: 'a', description: 'Remove an archived worktree'}),
    force: Flags.boolean({char: 'f', description: 'Force removal without prompting'}),
    remote: Flags.boolean({allowNo: true, char: 'r', description: 'Delete the remote branch as well'}),
  }

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Rm)
    const cwd = process.cwd()
    const git = simpleGit(cwd)

    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      this.error('Current directory is not a git repository.')
    }

    const rawWorktrees = await git.raw(['worktree', 'list', '--porcelain'])
    const mainWorktreeLine = rawWorktrees
      .trim()
      .split(/\r?\n/)
      .find((line) => line.startsWith('worktree '))
    const mainWorktreePath = mainWorktreeLine ? mainWorktreeLine.slice(9) : cwd

    if (cwd !== mainWorktreePath) {
      try {
        process.chdir(mainWorktreePath)
      } catch {}
    }

    const mainGit = simpleGit(mainWorktreePath)

    const configPath = path.resolve(mainWorktreePath, '.twigconfig.ts')
    const {config, error: configError} = await loadConfig(configPath)
    if (configError) {
      this.warn(
        `Failed to load .twigconfig.ts, using default config. (${configError.message})`,
      )
    }

    const worktreeBasePath = path.resolve(
      mainWorktreePath,
      config.worktree?.path ?? (DEFAULT_CONFIG.worktree?.path as string),
    )
    const archiveDir = path.join(worktreeBasePath, '.archive')

    let {branchName} = args
    let targetPath = ''
    let isArchive = false

    if (flags.archive) {
      isArchive = true
      let archivedBranches: string[] = []
      try {
        const items = await fs.readdir(archiveDir, {withFileTypes: true})
        archivedBranches = items.filter((i) => i.isDirectory()).map((i) => i.name)
      } catch {}

      if (archivedBranches.length === 0) {
        this.log('No archived worktrees found to remove.')
        return
      }

      if (!branchName) {
        const answers = await inquirer.prompt<{branchName: string}>([
          {
            choices: archivedBranches.map((branch) => ({name: branch, value: branch})),
            message: 'Select the archived worktree to remove:',
            name: 'branchName',
            type: 'select',
          },
        ])
        branchName = answers.branchName
      }

      if (!archivedBranches.includes(branchName)) {
        this.error(`Archived worktree for branch '${branchName}' not found.`)
      }

      targetPath = path.join(archiveDir, branchName)
    } else {
      const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

      if (worktrees.length === 0) {
        this.log('No worktrees found to remove.')
        return
      }

      if (!branchName) {
        const answers = await inquirer.prompt<{branchName: string}>([
          {
            choices: worktrees.map((wt) => ({name: wt.branch, value: wt.branch})),
            message: 'Select the worktree to remove:',
            name: 'branchName',
            type: 'select',
          },
        ])
        branchName = answers.branchName
      }

      const targetWorktree = worktrees.find((wt) => wt.branch === branchName)
      if (!targetWorktree) {
        this.error(`Worktree for branch '${branchName}' not found.`)
      }

      targetPath = targetWorktree.path
    }

    if (!branchName) {
      this.error('Branch name is required')
    }

    const baseBranch = config.worktree?.baseBranch ?? (DEFAULT_CONFIG.worktree?.baseBranch as string)

    let ghConfigured = false
    try {
      await execa('gh', ['auth', 'status'])
      ghConfigured = true
    } catch {
      ghConfigured = false
    }

    let shouldForce: boolean | null = Boolean(flags.force)

    if (!flags.force) {
      shouldForce = await this.checkForceDelete(ghConfigured, mainGit, branchName, baseBranch)
      if (shouldForce === null) return
    }

    let deleteRemote = flags.remote
    if (deleteRemote === undefined) {
      const {shouldDeleteRemote} = await inquirer.prompt<{shouldDeleteRemote: boolean}>([
        {
          default: false,
          message: `Delete remote branch 'origin/${branchName}' as well?`,
          name: 'shouldDeleteRemote',
          type: 'confirm',
        },
      ])
      deleteRemote = shouldDeleteRemote
    }

    const spinner = ora(
      `Removing ${isArchive ? 'archived worktree' : 'worktree'} and branch '${branchName}'...`,
    ).start()
    try {
      if (isArchive) {
        try {
          await fs.rm(targetPath, {force: true, recursive: true})
        } catch {}
      } else {
        await (shouldForce
          ? mainGit.raw(['worktree', 'remove', '--force', targetPath])
          : mainGit.raw(['worktree', 'remove', targetPath]))
      }

      try {
        await mainGit.branch(['-D', branchName])
      } catch (error) {
        if (!isArchive) throw error
      }

      if (!isArchive) {
        try {
          const stats = await fs.stat(targetPath)
          if (stats.isDirectory()) {
            await fs.rm(targetPath, {force: true, recursive: true})
          }
        } catch {}
      }

      let remoteDeleted = false
      let remoteError = ''
      if (deleteRemote) {
        try {
          await mainGit.push(['origin', '--delete', branchName])
          remoteDeleted = true
        } catch (error: unknown) {
          remoteError = error instanceof Error ? error.message : String(error)
        }
      }

      spinner.succeed(`Successfully removed ${isArchive ? 'archived worktree' : 'worktree'} and branch '${branchName}'`)

      if (deleteRemote && !remoteDeleted) {
        this.warn(`Failed to delete remote branch 'origin/${branchName}': ${remoteError}`)
      }
    } catch (error: unknown) {
      spinner.fail(`Failed to remove ${isArchive ? 'archived worktree' : 'worktree'} or branch`)
      this.error(error instanceof Error ? error.message : String(error))
    }
  }

  private async checkForceDelete(
    ghConfigured: boolean,
    git: SimpleGit,
    branchName: string,
    baseBranch: string,
  ): Promise<boolean | null> {
    if (!ghConfigured) {
      return this.checkMergedStatus(git, branchName, baseBranch)
    }

    try {
      const {stdout} = await execa('gh', ['pr', 'view', branchName, '--json', 'state'])
      const pr = JSON.parse(stdout)
      if (pr.state === 'OPEN') {
        const {force} = await inquirer.prompt<{force: boolean}>([
          {
            default: false,
            message: `Branch '${branchName}' has an OPEN pull request. Force delete?`,
            name: 'force',
            type: 'confirm',
          },
        ])
        if (!force) {
          this.log('Operation cancelled.')
          return null
        }

        return true
      }

      return this.checkMergedStatus(git, branchName, baseBranch)
    } catch {
      return this.checkMergedStatus(git, branchName, baseBranch)
    }
  }

  private async checkMergedStatus(git: SimpleGit, branchName: string, baseBranch: string): Promise<boolean | null> {
    let mergedBranches: string[] = []
    try {
      const branchSummary = await git.branch(['--merged', baseBranch])
      mergedBranches = branchSummary.all
    } catch {}

    const isMerged = mergedBranches.includes(branchName)

    if (!isMerged) {
      const {force} = await inquirer.prompt<{force: boolean}>([
        {
          default: false,
          message: `Branch '${branchName}' is not merged into ${baseBranch}. Force delete?`,
          name: 'force',
          type: 'confirm',
        },
      ])
      if (!force) {
        this.log('Operation cancelled.')
        return null
      }

      return true
    }

    return false
  }

  private parseWorktrees(raw: string): Worktree[] {
    const blocks = raw.trim().split(/\r?\n\r?\n/)
    return blocks
      .map((block) => {
        const lines = block.split(/\r?\n/)
        let wtPath = ''
        let branch = 'detached'
        for (const line of lines) {
          if (line.startsWith('worktree ')) {
            wtPath = line.slice(9)
          } else if (line.startsWith('branch refs/heads/')) {
            branch = line.slice(18)
          }
        }

        return {branch, path: wtPath}
      })
      .filter((wt) => wt.path)
  }
}
