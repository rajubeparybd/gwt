import {Command} from '@oclif/core'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import * as fs from 'node:fs/promises'
import {simpleGit} from 'simple-git'
import Table from 'tty-table'
import type {TwigxConfig} from '../types.js'
import {DEFAULT_CONFIG} from '../config.js'

interface Worktree {
  path: string
  branch: string
}

export default class Ls extends Command {
  static override description = 'List all git worktrees'

  public async run(): Promise<void> {
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

    // Get worktrees and filter out the main branch
    const rawWorktrees = await git.raw(['worktree', 'list', '--porcelain'])
    const worktrees = this.parseWorktrees(rawWorktrees).filter((wt) => wt.branch !== 'main')

    if (worktrees.length === 0) {
      this.log('No worktrees found.')
      return
    }

    const baseBranch = config.worktree?.baseBranch || (DEFAULT_CONFIG.worktree?.baseBranch as string)

    let mergedBranches: string[] = []
    try {
      const branchSummary = await git.branch(['--merged', baseBranch])
      mergedBranches = branchSummary.all
    } catch {}

    const repoFolder = path.basename(cwd)

    const header = [
      {value: 'Current Branch', align: 'left', headerColor: 'cyan', color: 'white'},
      {value: 'Repo Folder', align: 'left', headerColor: 'cyan', color: 'white'},
      {value: 'Worktree Folder', align: 'left', headerColor: 'cyan', color: 'white'},
      {value: `Merged into ${baseBranch}`, align: 'center', headerColor: 'cyan', color: 'white'},
    ]

    const rows = worktrees.map((wt) => {
      const isMerged = mergedBranches.includes(wt.branch) ? 'Yes' : 'No'
      return [wt.branch, repoFolder, path.basename(wt.path), isMerged]
    })

    const table = Table(header, rows, {
      borderStyle: 'solid',
      color: 'white',
    })

    this.log(table.render())
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
            wtPath = line.substring(9)
          } else if (line.startsWith('branch refs/heads/')) {
            branch = line.substring(18)
          }
        }
        return {path: wtPath, branch}
      })
      .filter((wt) => wt.path)
  }
}
