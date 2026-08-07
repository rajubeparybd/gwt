import {Args, Command} from '@oclif/core'
import {execa} from 'execa'
import inquirer from 'inquirer'
import {simpleGit} from 'simple-git'

interface Worktree {
  branch: string
  path: string
}

export default class Merge extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to merge PR for'}),
  }
  static override description = 'Merge a pull request for a worktree branch, fetch main, and archive the worktree'

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args} = await this.parse(Merge)
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
    const allParsedWorktrees = this.parseWorktrees(rawWorktrees)
    const worktrees = allParsedWorktrees.filter((wt) => wt.branch !== 'main')
    const mainWorktree = allParsedWorktrees.find((wt) => wt.branch === 'main')

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
            message: 'Select the worktree branch to merge PR for:',
            name: 'branchName',
            type: 'select',
          },
        ])
        branchName = answers.branchName
        targetWorktree = worktreesWithPrs.find((wt) => wt.branch === branchName)
      }
    }

    if (!targetWorktree) {
      this.error('Branch name is required (or could not be auto-detected)')
    }

    const mergeAnswers = await inquirer.prompt<{deleteBranch: boolean; strategy: string}>([
      {
        choices: [
          {name: 'Squash and merge', value: '--squash'},
          {name: 'Create a merge commit', value: '--merge'},
          {name: 'Rebase and merge', value: '--rebase'},
        ],
        message: 'What merge method would you like to use?',
        name: 'strategy',
        type: 'select',
      },
      {
        default: true,
        message: 'Delete the branch locally and on GitHub?',
        name: 'deleteBranch',
        type: 'confirm',
      },
    ])

    this.log(`Merging PR for branch '${targetWorktree.branch}'...`)

    try {
      await execa('gh', ['pr', 'merge', mergeAnswers.strategy], {
        cwd: targetWorktree.path,
        stdio: 'inherit',
      })
    } catch (error: unknown) {
      this.error(`Failed to merge PR: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (mergeAnswers.deleteBranch) {
      try {
        await simpleGit(targetWorktree.path).push(['origin', '--delete', targetWorktree.branch])
      } catch {}
    }

    this.log(`Fetching updated code into main branch...`)
    try {
      await (mainWorktree ? simpleGit(mainWorktree.path).pull() : git.fetch('origin', 'main:main'))
    } catch (error: unknown) {
      this.warn(`Failed to fetch main branch: ${error instanceof Error ? error.message : String(error)}`)
    }

    const actionAnswer = await inquirer.prompt<{action: string}>([
      {
        choices: [
          {name: 'Archive the worktree', value: 'archive'},
          {name: 'Delete the worktree completely', value: 'delete'},
        ],
        message: 'What should we do with the worktree?',
        name: 'action',
        type: 'select',
      },
    ])

    if (actionAnswer.action === 'archive') {
      this.log(`Archiving worktree '${targetWorktree.branch}'...`)
      try {
        await this.config.runCommand('archive', [targetWorktree.branch])
      } catch (error: unknown) {
        this.error(`Failed to archive worktree: ${error instanceof Error ? error.message : String(error)}`)
      }

      if (mergeAnswers.deleteBranch) {
        try {
          const mainGit = simpleGit(mainWorktree ? mainWorktree.path : process.cwd())
          await mainGit.branch(['-D', targetWorktree.branch])
        } catch {}
      }
    } else if (actionAnswer.action === 'delete') {
      this.log(`Deleting worktree '${targetWorktree.branch}'...`)
      try {
        await this.config.runCommand('rm', [targetWorktree.branch, '--force', '--no-remote'])
      } catch (error: unknown) {
        this.error(`Failed to delete worktree: ${error instanceof Error ? error.message : String(error)}`)
      }
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
