import {Args, Command} from '@oclif/core'
import inquirer from 'inquirer'
import {spawnSync} from 'node:child_process'
import {simpleGit} from 'simple-git'

interface Worktree {
  branch: string
  path: string
}

export default class Cd extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to change into'}),
  }
  static override description = 'Change terminal to a git worktree directory'

  public async run(): Promise<void> {
    const {args} = await this.parse(Cd)
    const cwd = process.cwd()

    const git = simpleGit(cwd)

    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      this.error('Current directory is not a git repository.')
    }

    const rawWorktrees = await git.raw(['worktree', 'list', '--porcelain'])
    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    if (worktrees.length === 0) {
      this.log('No worktrees found.')
      return
    }

    let {branchName} = args

    if (!branchName) {
      const answers = await inquirer.prompt<{branchName: string}>([
        {
          choices: worktrees.map((wt) => ({name: wt.branch, value: wt.branch})),
          message: 'Select the worktree to change into:',
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

    const targetPath = targetWorktree.path

    const shell = process.env.SHELL || process.env.COMSPEC || 'cmd.exe'

    this.log(`Spawning new shell in ${targetPath}... (type 'exit' to return)`)

    try {
      spawnSync(shell, [], {
        cwd: targetPath,
        stdio: 'inherit',
      })
    } catch (error: unknown) {
      this.error(`Failed to start shell: ${error instanceof Error ? error.message : String(error)}`)
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
