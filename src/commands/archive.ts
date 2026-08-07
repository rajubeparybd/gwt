import {Args, Command} from '@oclif/core'
import inquirer from 'inquirer'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import ora from 'ora'
import {simpleGit} from 'simple-git'

import {DEFAULT_CONFIG, loadConfig} from '../config.js'

interface Worktree {
  branch: string
  path: string
}

export default class Archive extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to archive'}),
  }
  static override description = 'Archive a git worktree'

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args} = await this.parse(Archive)
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

    const configPath = path.resolve(mainWorktreePath, '.twigconfig.ts')
    const {config, error: configError} = await loadConfig(configPath)
    if (configError) {
      this.warn(`Failed to load .twigconfig.ts, using default config. (${configError.message})`)
    }

    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    if (worktrees.length === 0) {
      this.log('No worktrees found to archive.')
      return
    }

    let {branchName} = args

    if (!branchName) {
      const answers = await inquirer.prompt<{branchName: string}>([
        {
          choices: worktrees.map((wt) => ({name: wt.branch, value: wt.branch})),
          message: 'Select the worktree to archive:',
          name: 'branchName',
          type: 'select',
        },
      ])
      branchName = answers.branchName
    }

    if (!branchName) {
      this.error('Branch name is required')
    }

    const targetWorktree = worktrees.find((wt) => wt.branch === branchName)
    if (!targetWorktree) {
      this.error(`Worktree for branch '${branchName}' not found.`)
    }

    const spinner = ora(`Archiving worktree '${branchName}'...`).start()
    try {
      const nodeModulesPath = path.join(targetWorktree.path, 'node_modules')
      const vendorPath = path.join(targetWorktree.path, 'vendor')

      try {
        const nmStats = await fs.stat(nodeModulesPath)
        if (nmStats.isDirectory()) {
          await fs.rm(nodeModulesPath, {force: true, recursive: true})
        }
      } catch {}

      try {
        const vendorStats = await fs.stat(vendorPath)
        if (vendorStats.isDirectory()) {
          await fs.rm(vendorPath, {force: true, recursive: true})
        }
      } catch {}

      const worktreeBasePath = path.resolve(
        mainWorktreePath,
        config.worktree?.path ?? (DEFAULT_CONFIG.worktree?.path as string),
      )
      const archiveDir = path.join(worktreeBasePath, '.archive')
      const targetArchiveDir = path.join(archiveDir, branchName)

      try {
        await fs.mkdir(archiveDir, {recursive: true})
      } catch {}

      try {
        const stats = await fs.stat(targetArchiveDir)
        if (stats) {
          spinner.fail(`Archive directory already exists for branch '${branchName}' at ${targetArchiveDir}`)
          return
        }
      } catch {}

      await fs.rename(targetWorktree.path, targetArchiveDir)

      const mainGit = simpleGit(mainWorktreePath)
      await mainGit.raw(['worktree', 'prune'])

      spinner.succeed(`Successfully archived worktree '${branchName}' to ${targetArchiveDir}`)
    } catch (error: unknown) {
      spinner.fail('Failed to archive worktree')
      const err = error as NodeJS.ErrnoException
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        this.error(
          `Cannot archive worktree because it is currently in use by another program. Please 'cd' out of the directory and run 'gwt archive ${branchName}' again.`,
        )
      }

      this.error(error instanceof Error ? error.message : String(error))
    }
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
