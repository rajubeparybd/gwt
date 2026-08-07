import * as fs from 'node:fs/promises'

import {TwigxConfig} from './types.js'

export const DEFAULT_CONFIG: TwigxConfig = {
  editors: {
    default: 'code',
    list: ['code', 'cursor', 'antigravity-ide'],
  },
  pr: {
    autoView: true,
    targetBranch: 'origin/main',
  },
  setup: {
    commands: [],
    copyFiles: [],
  },
  worktree: {
    baseBranch: 'origin/main',
    openAfterCreation: false,
    path: '.worktrees',
    pushAfterCreation: false,
  },
}

export async function loadConfig(configPath: string): Promise<{config: TwigxConfig; error?: Error}> {
  let config: TwigxConfig = DEFAULT_CONFIG
  let error: Error | undefined
  try {
    const configExists = await fs
      .stat(configPath)
      .then(() => true)
      .catch(() => false)
    if (configExists) {
      const {createJiti} = await import('jiti')
      const jiti = createJiti(import.meta.url)
      const imported = (await jiti.import(configPath, {default: true})) as TwigxConfig & {default?: TwigxConfig}
      config = imported.default || imported || DEFAULT_CONFIG
    }
  } catch (error_: unknown) {
    error = error_ instanceof Error ? error_ : new Error(String(error_))
  }

  return {config, error}
}
