/**
 * Configuration options for the Twigx CLI.
 * Typically loaded from a configuration file like .twigconfig.ts.
 */
export interface TwigxConfig {
  /**
   * Options related to code editors.
   */
  editors?: {
    /** The default editor command to use if none is explicitly selected. */
    default?: string

    /** A list of supported or available editor commands (e.g., ['code', 'vim']). */
    list?: string[]
  }

  /**
   * Options for setting up the environment in a newly created worktree.
   */
  setup?: {
    /** A list of shell commands to run after the worktree is created. */
    commands?: string[]

    /** A list of file paths to copy into the new worktree (e.g., '.env'). */
    copyFiles?: string[]

    /** A list of folder paths to copy into the new worktree. */
    copyFolders?: string[]
  }

  /**
   * Options related to Git worktree creation and management.
   */
  worktree?: {
    /** The base branch to use when creating a new worktree branch (e.g., 'main' or 'master'). */
    baseBranch?: string

    /** A prefix to prepend to all new branch names created for worktrees. */
    branchNamePrefix?: string

    /** Whether to automatically open the editor after creating a new worktree. */
    openAfterCreation?: boolean

    /** The default directory path where new worktrees should be created. */
    path?: string

    /** Whether to automatically push the new branch to the remote after creation. */
    pushAfterCreation?: boolean
  }
}
