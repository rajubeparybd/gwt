# twigx

A Git worktree and PR management CLI tool for streamlined development workflows

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@rajubepary/twigx.svg)](https://npmjs.org/package/@rajubepary/twigx)
[![Downloads/week](https://img.shields.io/npm/dw/@rajubepary/twigx.svg)](https://npmjs.org/package/@rajubepary/twigx)

<!-- toc -->

- [twigx](#twigx)
- [Usage](#usage)
- [Commands](#commands)

<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @rajubepary/twigx
$ twigx COMMAND
running command...
$ twigx (--version)
twigx/0.0.1 win32-x64 node-v25.2.1
$ twigx --help [COMMAND]
USAGE
  $ twigx COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`twigx archive [BRANCHNAME]`](#twigx-archive-branchname)
- [`twigx cd [BRANCHNAME]`](#twigx-cd-branchname)
- [`twigx help [COMMAND]`](#twigx-help-command)
- [`twigx init`](#twigx-init)
- [`twigx ls`](#twigx-ls)
- [`twigx new [BRANCHNAME]`](#twigx-new-branchname)
- [`twigx pr create [BRANCHNAME]`](#twigx-pr-create-branchname)
- [`twigx pr merge [BRANCHNAME]`](#twigx-pr-merge-branchname)
- [`twigx pr view [BRANCHNAME]`](#twigx-pr-view-branchname)
- [`twigx rm [BRANCHNAME]`](#twigx-rm-branchname)
- [`twigx unarchive [BRANCHNAME]`](#twigx-unarchive-branchname)

## `twigx archive [BRANCHNAME]`

Archive a git worktree

```
USAGE
  $ twigx archive [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to archive

DESCRIPTION
  Archive a git worktree
```

_See code: [src/commands/archive.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/archive.ts)_

## `twigx cd [BRANCHNAME]`

Change terminal to a git worktree directory

```
USAGE
  $ twigx cd [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to change into

DESCRIPTION
  Change terminal to a git worktree directory
```

_See code: [src/commands/cd.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/cd.ts)_

## `twigx help [COMMAND]`

Display help for twigx.

```
USAGE
  $ twigx help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for twigx.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.56/src/commands/help.ts)_

## `twigx init`

Initialize twigx in the current repository

```
USAGE
  $ twigx init [-f]

FLAGS
  -f, --force  Overwrite existing config file if it exists

DESCRIPTION
  Initialize twigx in the current repository
```

_See code: [src/commands/init.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/init.ts)_

## `twigx ls`

List all git worktrees

```
USAGE
  $ twigx ls [-a]

FLAGS
  -a, --archive  Include archived worktrees

DESCRIPTION
  List all git worktrees
```

_See code: [src/commands/ls.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/ls.ts)_

## `twigx new [BRANCHNAME]`

Create a new git worktree

```
USAGE
  $ twigx new [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the new branch

DESCRIPTION
  Create a new git worktree
```

_See code: [src/commands/new.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/new.ts)_

## `twigx pr create [BRANCHNAME]`

Create a pull request for a worktree branch

```
USAGE
  $ twigx pr create [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to create a PR for

DESCRIPTION
  Create a pull request for a worktree branch
```

_See code: [src/commands/pr/create.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/pr/create.ts)_

## `twigx pr merge [BRANCHNAME]`

Merge a pull request for a worktree branch, fetch main, and archive the worktree

```
USAGE
  $ twigx pr merge [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to merge PR for

DESCRIPTION
  Merge a pull request for a worktree branch, fetch main, and archive the worktree
```

_See code: [src/commands/pr/merge.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/pr/merge.ts)_

## `twigx pr view [BRANCHNAME]`

Review a pull request for a worktree branch

```
USAGE
  $ twigx pr view [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to view PR for

DESCRIPTION
  Review a pull request for a worktree branch
```

_See code: [src/commands/pr/view.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/pr/view.ts)_

## `twigx rm [BRANCHNAME]`

Remove a git worktree and its branch

```
USAGE
  $ twigx rm [BRANCHNAME] [-a] [-f] [-r]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to remove

FLAGS
  -a, --archive      Remove an archived worktree
  -f, --force        Force removal without prompting
  -r, --[no-]remote  Delete the remote branch as well

DESCRIPTION
  Remove a git worktree and its branch
```

_See code: [src/commands/rm.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/rm.ts)_

## `twigx unarchive [BRANCHNAME]`

Unarchive a git worktree and run setup scripts

```
USAGE
  $ twigx unarchive [BRANCHNAME]

ARGUMENTS
  [BRANCHNAME]  Name of the branch/worktree to unarchive

DESCRIPTION
  Unarchive a git worktree and run setup scripts
```

See code: [src/commands/unarchive.ts](https://github.com/rajubepary/twigx/blob/v0.0.1/src/commands/unarchive.ts)

---

Made with ❤️ by [Raju Bepary](https://x.com/intent/follow?screen_name=rajubeparybd)
