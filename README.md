# twigx

A new CLI generated with oclif

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/twigx.svg)](https://npmjs.org/package/twigx)
[![Downloads/week](https://img.shields.io/npm/dw/twigx.svg)](https://npmjs.org/package/twigx)

<!-- toc -->

- [Usage](#usage)
- [Commands](#commands)

<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g twigx
$ twigx COMMAND
running command...
$ twigx (--version)
twigx/0.0.0 win32-x64 node-v25.2.1
$ twigx --help [COMMAND]
USAGE
  $ twigx COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`twigx hello PERSON`](#twigx-hello-person)
- [`twigx hello world`](#twigx-hello-world)
- [`twigx help [COMMAND]`](#twigx-help-command)
- [`twigx plugins`](#twigx-plugins)
- [`twigx plugins add PLUGIN`](#twigx-plugins-add-plugin)
- [`twigx plugins:inspect PLUGIN...`](#twigx-pluginsinspect-plugin)
- [`twigx plugins install PLUGIN`](#twigx-plugins-install-plugin)
- [`twigx plugins link PATH`](#twigx-plugins-link-path)
- [`twigx plugins remove [PLUGIN]`](#twigx-plugins-remove-plugin)
- [`twigx plugins reset`](#twigx-plugins-reset)
- [`twigx plugins uninstall [PLUGIN]`](#twigx-plugins-uninstall-plugin)
- [`twigx plugins unlink [PLUGIN]`](#twigx-plugins-unlink-plugin)
- [`twigx plugins update`](#twigx-plugins-update)

## `twigx hello PERSON`

Say hello

```
USAGE
  $ twigx hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ twigx hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/Personal/twigx/blob/v0.0.0/src/commands/hello/index.ts)_

## `twigx hello world`

Say hello world

```
USAGE
  $ twigx hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ twigx hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/Personal/twigx/blob/v0.0.0/src/commands/hello/world.ts)_

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

## `twigx plugins`

List installed plugins.

```
USAGE
  $ twigx plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ twigx plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.86/src/commands/plugins/index.ts)_

## `twigx plugins add PLUGIN`

Installs a plugin into twigx.

```
USAGE
  $ twigx plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into twigx.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TWIG_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TWIG_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ twigx plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ twigx plugins add myplugin

  Install a plugin from a github url.

    $ twigx plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ twigx plugins add someuser/someplugin
```

## `twigx plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ twigx plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ twigx plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.86/src/commands/plugins/inspect.ts)_

## `twigx plugins install PLUGIN`

Installs a plugin into twigx.

```
USAGE
  $ twigx plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into twigx.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TWIG_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TWIG_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ twigx plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ twigx plugins install myplugin

  Install a plugin from a github url.

    $ twigx plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ twigx plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.86/src/commands/plugins/install.ts)_

## `twigx plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ twigx plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ twigx plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.86/src/commands/plugins/link.ts)_

## `twigx plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ twigx plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ twigx plugins unlink
  $ twigx plugins remove

EXAMPLES
  $ twigx plugins remove myplugin
```

## `twigx plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ twigx plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.86/src/commands/plugins/reset.ts)_

## `twigx plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ twigx plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ twigx plugins unlink
  $ twigx plugins remove

EXAMPLES
  $ twigx plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.86/src/commands/plugins/uninstall.ts)_

## `twigx plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ twigx plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ twigx plugins unlink
  $ twigx plugins remove

EXAMPLES
  $ twigx plugins unlink myplugin
```

## `twigx plugins update`

Update installed plugins.

```
USAGE
  $ twigx plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.86/src/commands/plugins/update.ts)_

<!-- commandsstop -->
