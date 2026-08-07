import {Args, Command} from '@oclif/core'
import inquirer from 'inquirer'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
import {simpleGit} from 'simple-git'

import {DEFAULT_CONFIG, loadConfig} from '../config.js'

interface Worktree {
  branch: string
  path: string
}

export default class Open extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to open'}),
  }
  static override description = 'Open a git worktree directory in the default editor'

  public async run(): Promise<void> {
    const {args} = await this.parse(Open)
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

    const worktrees = this.parseWorktrees(rawWorktrees)

    if (worktrees.length === 0) {
      this.log('No worktrees found.')
      return
    }

    let {branchName} = args

    if (!branchName) {
      const answers = await inquirer.prompt<{branchName: string}>([
        {
          choices: worktrees.map((wt) => ({name: wt.branch, value: wt.branch})),
          message: 'Select the worktree to open:',
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

    const editorList = config.editors?.list || DEFAULT_CONFIG.editors?.list || ['code']
    const defaultEditor = config.editors?.default || DEFAULT_CONFIG.editors?.default || 'code'

    const {editor} = await inquirer.prompt<{editor: string}>([
      {
        choices: editorList,
        default: defaultEditor,
        message: 'Select an editor to open the worktree:',
        name: 'editor',
        type: 'select',
      },
    ])

    this.log(`Opening ${targetPath} in ${editor}...`)

    try {
      spawnSync(`${editor} .`, {
        cwd: targetPath,
        shell: true,
        stdio: 'inherit',
      })
    } catch (error: unknown) {
      this.error(`Failed to start editor: ${error instanceof Error ? error.message : String(error)}`)
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
