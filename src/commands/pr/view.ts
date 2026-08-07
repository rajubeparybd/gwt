import {Args, Command} from '@oclif/core'
import {execa} from 'execa'
import inquirer from 'inquirer'
import {simpleGit} from 'simple-git'

interface Worktree {
  branch: string
  path: string
}

export default class View extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to view PR for'}),
  }
  static override description = 'Review a pull request for a worktree branch'

  public async run(): Promise<void> {
    const {args} = await this.parse(View)
    const cwd = process.cwd()
    const git = simpleGit(cwd)

    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      this.error('Current directory is not a git repository.')
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

    const rawWorktrees = await git.raw(['worktree', 'list', '--porcelain'])
    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    let {branchName} = args
    let targetWorktree: undefined | Worktree

    if (branchName) {
      targetWorktree = worktrees.find((wt) => wt.branch === branchName)
      if (!targetWorktree) {
        this.error(`Worktree for branch '${branchName}' not found.`)
      }
    } else {
      const worktreesWithPrs = worktrees.filter((wt) => activePrBranches.includes(wt.branch))

      try {
        const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD'])
        if (currentBranch !== 'main' && activePrBranches.includes(currentBranch)) {
          targetWorktree = worktreesWithPrs.find((wt) => wt.branch === currentBranch)
        }
      } catch {}

      if (!targetWorktree) {
        if (worktreesWithPrs.length === 0) {
          this.error('No worktrees with active PRs found.')
        }

        const answers = await inquirer.prompt<{branchName: string}>([
          {
            choices: worktreesWithPrs.map((wt) => ({name: wt.branch, value: wt.branch})),
            message: 'Select the worktree branch to view PR for:',
            name: 'branchName',
            type: 'select',
          },
        ])
        branchName = answers.branchName
        targetWorktree = worktreesWithPrs.find((wt) => wt.branch === branchName)
      }
    }

    if (!targetWorktree) {
      this.error('Branch name is required')
    }

    this.log(`Reviewing PR for branch '${targetWorktree.branch}'...`)

    try {
      await execa('gh', ['pr', 'view', '--web'], {
        cwd: targetWorktree.path,
        stdio: 'inherit',
      })
    } catch (error: unknown) {
      this.error(`Failed to view PR: ${error instanceof Error ? error.message : String(error)}`)
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
