/* eslint-disable no-await-in-loop */
import {Args, Command} from '@oclif/core'
import {execa} from 'execa'
import inquirer from 'inquirer'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import ora from 'ora'
import {simpleGit} from 'simple-git'

import type {TwigxConfig} from '../types.js'

import {DEFAULT_CONFIG} from '../config.js'

export default class New extends Command {
  static override args = {
    branchName: Args.string({description: 'Name of the new branch'}),
  }
  static override description = 'Create a new git worktree'

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args} = await this.parse(New)

    const cwd = process.cwd()
    const git = simpleGit(cwd)

    const isRepo = await git.checkIsRepo()
    if (isRepo) {
      // Continue
    } else {
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

    let {branchName} = args

    if (!branchName) {
      const answers = await inquirer.prompt<{branchName: string}>([
        {
          message: 'Enter the new branch name:',
          name: 'branchName',
          type: 'input',
          validate: (input: string) => (input.trim() === '' ? 'Branch name is required' : true),
        },
      ])
      branchName = answers.branchName
    }

    if (!branchName) {
      this.error('Branch name is required')
    }

    const worktreePath = path.resolve(
      mainWorktreePath,
      config.worktree?.path ?? (DEFAULT_CONFIG.worktree?.path as string),
      branchName,
    )
    const baseBranch = config.worktree?.baseBranch ?? (DEFAULT_CONFIG.worktree?.baseBranch as string)

    const fetchSpinner = ora('Fetching latest from origin...').start()
    try {
      await git.fetch('origin')
      fetchSpinner.succeed('Fetched latest from origin')
    } catch (error: unknown) {
      fetchSpinner.warn(`Failed to fetch from origin: ${error instanceof Error ? error.message : String(error)}`)
    }

    const spinner = ora('Creating worktree...').start()
    try {
      await git.raw(['worktree', 'add', '-b', branchName, worktreePath, baseBranch])
      spinner.succeed(`Worktree created at ${worktreePath} on branch ${branchName}`)
    } catch (error: unknown) {
      spinner.fail('Failed to create worktree')
      this.error(error instanceof Error ? error.message : String(error))
    }

    if (config.setup?.copyFiles && config.setup.copyFiles.length > 0) {
      const copySpinner = ora('Copying setup files...').start()
      let hasError = false
      for (const file of config.setup.copyFiles) {
        const srcPath = path.resolve(cwd, file)
        const destPath = path.resolve(worktreePath, file)
        try {
          await fs.copyFile(srcPath, destPath)
        } catch {
          hasError = true
          this.warn(`Failed to copy ${file}`)
        }
      }

      if (hasError) {
        copySpinner.warn('Some setup files failed to copy')
      } else {
        copySpinner.succeed('Setup files copied')
      }
    }

    if (config.setup?.commands && config.setup.commands.length > 0) {
      for (const cmd of config.setup.commands) {
        const cmdSpinner = ora(`Running setup command: ${cmd}`).start()
        try {
          await execa({cwd: worktreePath, shell: true})`${cmd}`
        } catch (error: unknown) {
          cmdSpinner.fail(`Setup command failed: ${cmd}`)
          this.warn(error instanceof Error ? error.message : String(error))
          continue
        }

        cmdSpinner.succeed(`Setup command completed: ${cmd}`)
      }
    }

    if (config.worktree?.pushAfterCreation) {
      const pushSpinner = ora(`Pushing branch ${branchName} to origin...`).start()
      try {
        await git.push(['-u', 'origin', branchName])
        pushSpinner.succeed(`Pushed branch ${branchName} to origin`)
      } catch (error: unknown) {
        pushSpinner.fail(`Failed to push branch ${branchName}`)
        this.warn(error instanceof Error ? error.message : String(error))
      }
    }

    if (config.worktree?.openAfterCreation) {
      const editor = config.editors?.default ?? (DEFAULT_CONFIG.editors?.default as string)
      const openSpinner = ora(`Opening in ${editor}...`).start()
      try {
        await execa({cwd: worktreePath, shell: true})`${editor} .`
        openSpinner.succeed(`Opened in ${editor}`)
      } catch (error: unknown) {
        openSpinner.fail(`Failed to open in ${editor}`)
        this.warn(error instanceof Error ? error.message : String(error))
      }
    }
  }
}
