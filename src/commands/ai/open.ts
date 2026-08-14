import {Args, Command} from '@oclif/core'
import inquirer from 'inquirer'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
import {simpleGit} from 'simple-git'

import {DEFAULT_CONFIG, loadConfig} from '../../config.js'

interface Worktree {
  branch: string
  path: string
}

export default class AiOpen extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to run AI in'}),
  }
  static override description = 'Run the AI command in a git worktree'

  public async run(): Promise<void> {
    const {args} = await this.parse(AiOpen)
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

    const configPath = path.resolve(mainWorktreePath, '.gwtconfig.ts')
    const {config, error: configError} = await loadConfig(configPath)
    if (configError) {
      this.warn(`Failed to load .gwtconfig.ts, using default config. (${configError.message})`)
    }

    const aiCommand = config.aiCommand ?? DEFAULT_CONFIG.aiCommand ?? 'claude --dangerously-skip-permissions'

    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    let {branchName} = args
    let targetPath = cwd

    if (!branchName) {
      if (worktrees.length > 0) {
        const answers = await inquirer.prompt<{branchName: string}>([
          {
            choices: [
              {name: 'Current Directory', value: 'current'},
              ...worktrees.map((wt) => ({name: wt.branch, value: wt.branch})),
            ],
            message: 'Select the worktree to run AI in:',
            name: 'branchName',
            type: 'select',
          },
        ])
        branchName = answers.branchName
      } else {
        branchName = 'current'
      }
    }

    if (branchName && branchName !== 'current') {
      const targetWorktree = worktrees.find((wt) => wt.branch === branchName)
      if (!targetWorktree) {
        this.error(`Worktree for branch '${branchName}' not found.`)
      }

      targetPath = targetWorktree.path
    }

    this.log(`Running AI command in ${targetPath}...`)

    try {
      spawnSync(aiCommand, [], {
        cwd: targetPath,
        shell: true,
        stdio: 'inherit',
      })
    } catch (error: unknown) {
      this.error(`Failed to start AI command: ${error instanceof Error ? error.message : String(error)}`)
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
