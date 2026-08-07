import {Args, Command} from '@oclif/core'
import {execa} from 'execa'
import inquirer from 'inquirer'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {simpleGit} from 'simple-git'

import type {TwigxConfig} from '../../types.js'

import {DEFAULT_CONFIG} from '../../config.js'

interface Worktree {
  branch: string
  path: string
}

export default class Create extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to create a PR for'}),
  }
  static override description = 'Create a pull request for a worktree branch'

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args} = await this.parse(Create)
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

    const configPath = path.resolve(mainWorktreePath, '.twigconfig.ts')
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

    try {
      await execa('gh', ['auth', 'status'])
    } catch {
      this.error('GitHub CLI (gh) is not installed or not authenticated. Please run `gh auth login` first.')
    }

    let activePrBranches: string[] = []
    try {
      const {stdout} = await execa('gh', ['pr', 'list', '--state', 'open', '--json', 'headRefName'])
      const prs = JSON.parse(stdout) as {headRefName: string}[]
      activePrBranches = prs.map((pr) => pr.headRefName)
    } catch (error: unknown) {
      this.error(`Failed to fetch active PRs: ${error instanceof Error ? error.message : String(error)}`)
    }

    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    let {branchName} = args
    let targetWorktree: undefined | Worktree

    if (branchName) {
      targetWorktree = worktrees.find((wt) => wt.branch === branchName)
      if (!targetWorktree) {
        this.error(`Worktree for branch '${branchName}' not found.`)
      }
    } else {
      const worktreesWithoutPrs = worktrees.filter((wt) => !activePrBranches.includes(wt.branch))

      try {
        const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD'])
        if (currentBranch !== 'main' && !activePrBranches.includes(currentBranch)) {
          targetWorktree = worktreesWithoutPrs.find((wt) => wt.branch === currentBranch)
        }
      } catch {}

      if (!targetWorktree) {
        if (worktreesWithoutPrs.length === 0) {
          this.error('No available worktrees found without an active PR.')
        }

        const answers = await inquirer.prompt<{branchName: string}>([
          {
            choices: worktreesWithoutPrs.map((wt) => ({name: wt.branch, value: wt.branch})),
            message: 'Select the worktree branch to create PR for:',
            name: 'branchName',
            type: 'select',
          },
        ])
        branchName = answers.branchName
        targetWorktree = worktreesWithoutPrs.find((wt) => wt.branch === branchName)
      }
    }

    if (!targetWorktree) {
      this.error('Branch name is required')
    }

    if (activePrBranches.includes(targetWorktree.branch)) {
      this.error(`An active PR already exists for branch '${targetWorktree.branch}'.`)
    }

    const rawTargetBranch = config.pr?.targetBranch || DEFAULT_CONFIG.pr?.targetBranch || 'main'
    const targetBranch = rawTargetBranch.replace(/^origin\//, '')

    this.log(`Creating PR for branch '${targetWorktree.branch}' against base '${targetBranch}'...`)

    try {
      await execa('gh', ['pr', 'create', '--base', targetBranch], {
        cwd: targetWorktree.path,
        stdio: 'inherit',
      })

      if (config.pr?.autoView) {
        this.log('Opening PR in browser...')
        await execa('gh', ['pr', 'view', '--web'], {
          cwd: targetWorktree.path,
          stdio: 'inherit',
        })
      }
    } catch (error: unknown) {
      this.error(`Failed to create PR: ${error instanceof Error ? error.message : String(error)}`)
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
