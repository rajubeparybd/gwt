import {TwigxConfig} from './types.js'

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
