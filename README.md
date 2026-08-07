# gwt

A Git worktree and PR management CLI tool for streamlined development workflows

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@rajubepary/gwt.svg)](https://npmjs.org/package/@rajubepary/gwt)
[![Downloads/week](https://img.shields.io/npm/dw/@rajubepary/gwt.svg)](https://npmjs.org/package/@rajubepary/gwt)

<!-- toc -->

- [gwt](#gwt)
- [Usage](#usage)
- [Commands](#commands)

<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @rajubepary/gwt
$ gwt COMMAND
running command...
$ gwt (--version)
gwt/0.0.1 win32-x64 node-v25.2.1
$ gwt --help [COMMAND]
USAGE
  $ gwt COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`gwt archive [BRANCHNAME]`](#gwt-archive-branchname)
- [`gwt cd [BRANCHNAME]`](#gwt-cd-branchname)
- [`gwt help [COMMAND]`](#gwt-help-command)
- [`gwt init`](#gwt-init)
- [`gwt ls`](#gwt-ls)
- [`gwt new [BRANCHNAME]`](#gwt-new-branchname)
- [`gwt pr create [BRANCHNAME]`](#gwt-pr-create-branchname)
- [`gwt pr merge [BRANCHNAME]`](#gwt-pr-merge-branchname)
- [`gwt pr view [BRANCHNAME]`](#gwt-pr-view-branchname)
- [`gwt rm [BRANCHNAME]`](#gwt-rm-branchname)
- [`gwt unarchive [BRANCHNAME]`](#gwt-unarchive-branchname)

## `gwt archive [BRANCHNAME]`

Archive a git worktree

```
USAGE
  $ gwt archive [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to archive

DESCRIPTION
  Archive a git worktree
```

_See code: [src/commands/archive.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/archive.ts)_

## `gwt cd [BRANCHNAME]`

Change terminal to a git worktree directory

```
USAGE
  $ gwt cd [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to change into

DESCRIPTION
  Change terminal to a git worktree directory
```

_See code: [src/commands/cd.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/cd.ts)_

## `gwt help [COMMAND]`

Display help for gwt.

```
USAGE
  $ gwt help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for gwt.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.56/src/commands/help.ts)_

## `gwt init`

Initialize gwt in the current repository

```
USAGE
  $ gwt init [-f]

FLAGS
  -f, --force  Overwrite existing config file if it exists

DESCRIPTION
  Initialize gwt in the current repository
```

_See code: [src/commands/init.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/init.ts)_

## `gwt ls`

List all git worktrees

```
USAGE
  $ gwt ls [-a]

FLAGS
  -a, --archive  Include archived worktrees

DESCRIPTION
  List all git worktrees
```

_See code: [src/commands/ls.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/ls.ts)_

## `gwt new [BRANCHNAME]`

Create a new git worktree

```
USAGE
  $ gwt new [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the new branch

DESCRIPTION
  Create a new git worktree
```

_See code: [src/commands/new.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/new.ts)_

## `gwt pr create [BRANCHNAME]`

Create a pull request for a worktree branch

```
USAGE
  $ gwt pr create [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to create a PR for

DESCRIPTION
  Create a pull request for a worktree branch
```

_See code: [src/commands/pr/create.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/pr/create.ts)_

## `gwt pr merge [BRANCHNAME]`

Merge a pull request for a worktree branch, fetch main, and archive the worktree

```
USAGE
  $ gwt pr merge [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to merge PR for

DESCRIPTION
  Merge a pull request for a worktree branch, fetch main, and archive the worktree
```

_See code: [src/commands/pr/merge.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/pr/merge.ts)_

## `gwt pr view [BRANCHNAME]`

Review a pull request for a worktree branch

```
USAGE
  $ gwt pr view [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to view PR for

DESCRIPTION
  Review a pull request for a worktree branch
```

_See code: [src/commands/pr/view.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/pr/view.ts)_

## `gwt rm [BRANCHNAME]`

Remove a git worktree and its branch

```
USAGE
  $ gwt rm [BRANCHNAME] [-a] [-f] [-r]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to remove

FLAGS
  -a, --archive      Remove an archived worktree
  -f, --force        Force removal without prompting
  -r, --[no-]remote  Delete the remote branch as well

DESCRIPTION
  Remove a git worktree and its branch
```

_See code: [src/commands/rm.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/rm.ts)_

## `gwt unarchive [BRANCHNAME]`

Unarchive a git worktree and run setup scripts

```
USAGE
  $ gwt unarchive [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to unarchive

DESCRIPTION
  Unarchive a git worktree and run setup scripts
```

See code: [src/commands/unarchive.ts](https://github.com/rajubepary/gwt/blob/v0.0.1/src/commands/unarchive.ts)

---

Made with ❤️ by [Raju Bepary](https://x.com/intent/follow?screen_name=rajubeparybd)
