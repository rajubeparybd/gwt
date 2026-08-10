import {Command, Flags} from '@oclif/core'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
import {simpleGit} from 'simple-git'

import {DEFAULT_CONFIG, loadConfig} from '../../config.js'

export default class AiReview extends Command {
  static override description = 'Run an AI code review against a target branch'
  static override flags = {
    target: Flags.string({
      char: 't',
      description: 'Target branch to review against',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AiReview)
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
    const {config, error: configError} = await loadConfig(configPath)
    if (configError) {
      this.warn(`Failed to load .twigconfig.ts, using default config. (${configError.message})`)
    }

    const aiCommand = config.aiCommand ?? DEFAULT_CONFIG.aiCommand ?? 'claude --dangerously-skip-permissions'

    const targetBranch = flags.target ?? config.worktree?.baseBranch ?? 'origin/main'
    this.log(`Initiating AI review against target branch: ${targetBranch}...`)

    const prompt = `Review the code changes in the current branch against the ${targetBranch} branch and any uncommitted changes. Identify any bugs, security issues, or performance concerns.`

    // Construct the command. We escape the prompt for shell execution.
    const escapedPrompt = prompt.replaceAll('"', String.raw`\"`)
    const fullCommand = `${aiCommand} "${escapedPrompt}"`

    try {
      spawnSync(fullCommand, [], {
        cwd,
        shell: true,
        stdio: 'inherit',
      })
    } catch (error: unknown) {
      this.error(`Failed to start AI command: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
