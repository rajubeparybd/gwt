#!/usr/bin/env node

const originalEmit = process.emit
process.emit = function (name, data, ...args) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'Warning' &&
    data.message &&
    data.message.includes('MODULE_TYPELESS_PACKAGE_JSON')
  ) {
    return false
  }

  return originalEmit.apply(process, [name, data, ...args])
}

import {execute} from '@oclif/core'

await execute({dir: import.meta.url})
