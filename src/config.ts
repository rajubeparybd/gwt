import {TwigxConfig} from './types.js'

export const DEFAULT_CONFIG: TwigxConfig = {
  editors: {
    default: 'code',
    list: ['code', 'cursor', 'antigravity'],
  },
  setup: {
    commands: [],
    copyFiles: [],
  },
  worktree: {
    baseBranch: 'origin/main',
    branchNamePrefix: 'feat',
    openAfterCreation: false,
    path: '.twigx-worktrees',
    pushAfterCreation: false,
  },
}
