/* eslint-disable no-await-in-loop */
import {Args, Command} from '@oclif/core'
import {execa} from 'execa'
import inquirer from 'inquirer'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import ora from 'ora'
import {simpleGit} from 'simple-git'

import {DEFAULT_CONFIG, loadConfig} from '../config.js'

export default class Unarchive extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the branch/worktree to unarchive'}),
  }
  static override description = 'Unarchive a git worktree and run setup scripts'

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args} = await this.parse(Unarchive)
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

    const worktreeBasePath = path.resolve(
      mainWorktreePath,
      config.worktree?.path ?? (DEFAULT_CONFIG.worktree?.path as string),
    )
    const archiveDir = path.join(worktreeBasePath, '.archive')

    let archivedBranches: string[] = []
    try {
      const items = await fs.readdir(archiveDir, {withFileTypes: true})
      archivedBranches = items.filter((i) => i.isDirectory()).map((i) => i.name)
    } catch {}

    if (archivedBranches.length === 0) {
      this.log('No archived worktrees found.')
      return
    }

    let {branchName} = args

    if (!branchName) {
      const answers = await inquirer.prompt<{branchName: string}>([
        {
          choices: archivedBranches.map((branch) => ({name: branch, value: branch})),
          message: 'Select the worktree to unarchive:',
          name: 'branchName',
          type: 'select',
        },
      ])
      branchName = answers.branchName
    }

    if (!branchName) {
      this.error('Branch name is required')
    }

    if (!archivedBranches.includes(branchName)) {
      this.error(`Archived worktree for branch '${branchName}' not found.`)
    }

    const sourceArchiveDir = path.join(archiveDir, branchName)
    const targetWorktreePath = path.join(worktreeBasePath, branchName)

    try {
      const stats = await fs.stat(targetWorktreePath)
      if (stats) {
        this.error(`Target worktree directory already exists at ${targetWorktreePath}`)
      }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.error(`Error checking target path: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    const spinner = ora(`Unarchiving worktree '${branchName}'...`).start()
    try {
      await git.raw(['worktree', 'add', targetWorktreePath, branchName])

      const copyDir = async (src: string, dest: string) => {
        const entries = await fs.readdir(src, {withFileTypes: true})
        for (const entry of entries) {
          if (entry.name === '.git') continue
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          if (entry.isDirectory()) {
            await fs.mkdir(destPath, {recursive: true})
            await copyDir(srcPath, destPath)
          } else {
            await fs.copyFile(srcPath, destPath)
          }
        }
      }

      await copyDir(sourceArchiveDir, targetWorktreePath)

      await fs.rm(sourceArchiveDir, {force: true, recursive: true})

      spinner.succeed(`Successfully unarchived worktree '${branchName}'`)
    } catch (error: unknown) {
      spinner.fail('Failed to unarchive worktree')
      this.error(error instanceof Error ? error.message : String(error))
    }

    if (config.setup?.commands && config.setup.commands.length > 0) {
      for (const cmd of config.setup.commands) {
        const cmdSpinner = ora(`Running setup command: ${cmd}`).start()
        try {
          await execa({cwd: targetWorktreePath, shell: true})`${cmd}`
        } catch (error: unknown) {
          cmdSpinner.fail(`Setup command failed: ${cmd}`)
          this.warn(error instanceof Error ? error.message : String(error))
          continue
        }

        cmdSpinner.succeed(`Setup command completed: ${cmd}`)
      }
    }

    if (config.worktree?.openAfterCreation) {
      const editor = config.editors?.default ?? (DEFAULT_CONFIG.editors?.default as string)
      const openSpinner = ora(`Opening in ${editor}...`).start()
      try {
        await execa({cwd: targetWorktreePath, shell: true})`${editor} .`
        openSpinner.succeed(`Opened in ${editor}`)
      } catch (error: unknown) {
        openSpinner.fail(`Failed to open in ${editor}`)
        this.warn(error instanceof Error ? error.message : String(error))
      }
    }
  }
}
