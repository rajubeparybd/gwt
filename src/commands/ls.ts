import {Command, Flags} from '@oclif/core'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import {simpleGit} from 'simple-git'
import table from 'tty-table'

import {DEFAULT_CONFIG, loadConfig} from '../config.js'

interface Worktree {
  branch: string
  path: string
}

export default class Ls extends Command {
  static override description = 'List all git worktrees'
  static override flags = {
    archive: Flags.boolean({char: 'a', description: 'Include archived worktrees'}),
  }

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {flags} = await this.parse(Ls)
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

    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    let archivedBranches: string[] = []
    if (flags.archive) {
      const worktreeBasePath = path.resolve(
        mainWorktreePath,
        config.worktree?.path ?? (DEFAULT_CONFIG.worktree?.path as string),
      )
      const archiveDir = path.join(worktreeBasePath, '.archive')
      try {
        const items = await fs.readdir(archiveDir, {withFileTypes: true})
        archivedBranches = items.filter((i) => i.isDirectory()).map((i) => i.name)
      } catch {}
    }

    if (worktrees.length === 0 && (!flags.archive || archivedBranches.length === 0)) {
      this.log('No worktrees found.')
      return
    }

    const baseBranch = config.worktree?.baseBranch ?? (DEFAULT_CONFIG.worktree?.baseBranch as string)

    let mergedBranches: string[] = []
    try {
      const branchSummary = await git.branch(['--merged', baseBranch])
      mergedBranches = branchSummary.all
    } catch {}

    const header = [
      {align: 'left', color: 'white', headerColor: 'cyan', value: 'Branch'},
      {align: 'left', color: 'white', headerColor: 'cyan', value: 'Worktree'},
      {align: 'center', color: 'white', headerColor: 'cyan', value: `Merged into ${baseBranch}`},
    ]

    if (flags.archive) {
      header.push({align: 'center', color: 'white', headerColor: 'cyan', value: 'Status'})
    }

    const rows = worktrees.map((wt) => {
      const isMerged = mergedBranches.includes(wt.branch) ? 'Yes' : 'No'
      const row = [
        wt.branch,
        path.join(config.worktree?.path || (DEFAULT_CONFIG.worktree?.path as string), path.basename(wt.path)),
        isMerged,
      ]
      if (flags.archive) {
        row.push('Active')
      }

      return row
    })

    if (flags.archive) {
      for (const branch of archivedBranches) {
        const isMerged = mergedBranches.includes(branch) ? 'Yes' : 'No'
        rows.push([
          branch,
          path.join(config.worktree?.path || (DEFAULT_CONFIG.worktree?.path as string), '.archive', branch),
          isMerged,
          'Archived',
        ])
      }
    }

    const tbl = table(header, rows, {
      borderStyle: 'solid',
      color: 'white',
    })

    this.log(tbl.render())
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
