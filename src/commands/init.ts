import {Command, Flags} from '@oclif/core'
import {execa} from 'execa'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import ora from 'ora'

import {DEFAULT_CONFIG} from '../config.js'

export default class Init extends Command {
  static override description = 'Initialize gwt in the current repository'
  static override flags = {
    force: Flags.boolean({char: 'f', description: 'Overwrite existing config file if it exists'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Init)

    const cwd = process.cwd()
    const configPath = path.resolve(cwd, '.gwtconfig.ts')
    const gitignorePath = path.resolve(cwd, '.gitignore')
    const worktreeFolder = DEFAULT_CONFIG.worktree?.path ?? '.gwt-worktrees'

    // 1. Create config file
    const configContent = `import type { TwigxConfig } from '@rajubepary/gwt';

const config: TwigxConfig = {
  editors: {
    default: 'code',
    list: ['code', 'cursor', 'antigravity-ide'],
  },
  pr: {
    autoView: true,
    targetBranch: 'origin/main',
  },
  setup: {
    commands: ['npm install'],
    copyFiles: ['.env'],
  },
  worktree: {
    baseBranch: 'origin/main',
    openAfterCreation: true,
    path: '.worktrees',
    pushAfterCreation: true,
  },
  aiCommand: "claude --dangerously-skip-permissions",
};

export default config;
`

    const configSpinner = ora('Creating .gwtconfig.ts').start()
    try {
      const configExists = await fs
        .stat(configPath)
        .then(() => true)
        .catch(() => false)
      if (configExists && !flags.force) {
        configSpinner.info('.gwtconfig.ts already exists. Use --force to overwrite.')
      } else {
        await fs.writeFile(configPath, configContent, 'utf8')
        configSpinner.succeed(configExists ? 'Overwrote existing .gwtconfig.ts' : 'Created .gwtconfig.ts')
      }
    } catch (error) {
      configSpinner.fail('Failed to create config file')
      this.error(`Failed to create config file: ${error instanceof Error ? error.message : String(error)}`)
    }

    // 2. Update .gitignore
    const gitignoreSpinner = ora('Updating .gitignore').start()
    try {
      const gitignoreExists = await fs
        .stat(gitignorePath)
        .then(() => true)
        .catch(() => false)

      if (gitignoreExists) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8')
        const lines = gitignoreContent.split(/\r?\n/)
        if (lines.includes(worktreeFolder)) {
          gitignoreSpinner.info(`${worktreeFolder} is already in .gitignore`)
        } else {
          const newContent =
            gitignoreContent.endsWith('\n') || gitignoreContent === ''
              ? `${gitignoreContent}${worktreeFolder}\n`
              : `${gitignoreContent}\n${worktreeFolder}\n`
          await fs.writeFile(gitignorePath, newContent, 'utf8')
          gitignoreSpinner.succeed(`Added ${worktreeFolder} to .gitignore`)
        }
      } else {
        await fs.writeFile(gitignorePath, `${worktreeFolder}\n`, 'utf8')
        gitignoreSpinner.succeed(`Created .gitignore and added ${worktreeFolder}`)
      }
    } catch (error) {
      gitignoreSpinner.fail('Failed to update .gitignore')
      this.error(`Failed to update .gitignore: ${error instanceof Error ? error.message : String(error)}`)
    }

    // 3. Install @rajubepary/gwt as a dev dependency
    const installSpinner = ora('Installing @rajubepary/gwt as a dev dependency').start()
    try {
      await execa('npm', ['install', '@rajubepary/gwt', '-D'], {cwd})
      installSpinner.succeed('Installed @rajubepary/gwt')
    } catch {
      installSpinner.fail('Failed to install @rajubepary/gwt')
      this.log(`Please run 'npm install @rajubepary/gwt -D' manually.`)
    }
  }
}
