import {TwigxConfig} from './types.js'

export const DEFAULT_CONFIG: TwigxConfig = {
  editors: {
    default: 'code',
    list: ['code', 'cursor', 'antigravity'],
  },
  setup: {
    commands: ['npm install'],
    copyFiles: ['.env'],
  },
  worktree: {
    baseBranch: 'origin/main',
    branchNamePrefix: 'w',
    openAfterCreation: true,
    path: '.twigx-worktrees',
    pushAfterCreation: true,
  },
}
