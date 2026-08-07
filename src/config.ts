import {TwigxConfig} from './types.js'
import * as fs from 'node:fs/promises'

export const DEFAULT_CONFIG: TwigxConfig = {
  editors: {
    default: 'code',
    list: ['code', 'cursor', 'antigravity'],
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
    path: '.twigx-worktrees',
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
      const { createJiti } = await import('jiti')
      const jiti = createJiti(import.meta.url)
      const imported = await jiti.import(configPath, { default: true }) as any
      config = imported.default || imported || DEFAULT_CONFIG
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err : new Error(String(err))
  }
  return {config, error}
}
