import {Args, Command} from '@oclif/core'
import {execa} from 'execa'
import inquirer from 'inquirer'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import ora from 'ora'
import {simpleGit, SimpleGit} from 'simple-git'

import type {TwigxConfig} from '../types.js'

import {DEFAULT_CONFIG} from '../config.js'

interface Worktree {
  branch: string
  path: string
}

export default class Rm extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to remove'}),
  }
  static override description = 'Remove a git worktree and its branch'

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args} = await this.parse(Rm)
    const cwd = process.cwd()
    const configPath = path.resolve(cwd, '.twigconfig.ts')
    let config: TwigxConfig = DEFAULT_CONFIG

    try {
      const configExists = await fs
        .stat(configPath)
        .then(() => true)
        .catch(() => false)
      if (configExists) {
        const imported = await import(pathToFileURL(configPath).href)
        config = imported.default || imported
      }
    } catch (error: unknown) {
      this.warn(
        `Failed to load .twigconfig.ts, using default config. (${error instanceof Error ? error.message : String(error)})`,
      )
    }

    const git = simpleGit(cwd)

    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      this.error('Current directory is not a git repository.')
    }

    const rawWorktrees = await git.raw(['worktree', 'list', '--porcelain'])
    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    if (worktrees.length === 0) {
      this.log('No worktrees found to remove.')
      return
    }

    let {branchName} = args

    if (!branchName) {
      const answers = await inquirer.prompt<{branchName: string}>([
        {
          choices: worktrees.map((wt) => ({name: wt.branch, value: wt.branch})),
          message: 'Select the worktree to remove:',
          name: 'branchName',
          type: 'list',
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

    const baseBranch = config.worktree?.baseBranch ?? (DEFAULT_CONFIG.worktree?.baseBranch as string)

    let ghConfigured = false
    try {
      await execa('gh', ['auth', 'status'])
      ghConfigured = true
    } catch {
      ghConfigured = false
    }

    let shouldForce: boolean | null = false

    if (ghConfigured) {
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
            return
          }

          shouldForce = true
        } else {
          shouldForce = await this.checkMergedStatus(git, branchName, baseBranch)
          if (shouldForce === null) return
        }
      } catch {
        shouldForce = await this.checkMergedStatus(git, branchName, baseBranch)
        if (shouldForce === null) return
      }
    } else {
      shouldForce = await this.checkMergedStatus(git, branchName, baseBranch)
      if (shouldForce === null) return
    }

    const spinner = ora(`Removing worktree and branch '${branchName}'...`).start()
    try {
      await (shouldForce
        ? git.raw(['worktree', 'remove', '--force', targetWorktree.path])
        : git.raw(['worktree', 'remove', targetWorktree.path]))

      await git.branch(['-D', branchName])

      try {
        const stats = await fs.stat(targetWorktree.path)
        if (stats.isDirectory()) {
          await fs.rm(targetWorktree.path, {force: true, recursive: true})
        }
      } catch {}

      spinner.succeed(`Successfully removed worktree and branch '${branchName}'`)
    } catch (error: unknown) {
      spinner.fail('Failed to remove worktree or branch')
      this.error(error instanceof Error ? error.message : String(error))
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
