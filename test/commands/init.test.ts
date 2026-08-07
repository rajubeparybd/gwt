import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

describe('init', () => {
  let originalCwd: string
  let tempDir: string

  beforeEach(async () => {
    originalCwd = process.cwd()
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'twigx-test-'))
    process.chdir(tempDir)
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await fs.rm(tempDir, {force: true, recursive: true})
  })

  it('creates .twigconfig.ts and adds worktree to .gitignore', async () => {
    const {stderr, stdout} = await runCommand('init')
    const output = stdout + stderr

    expect(output).to.contain('Created .twigconfig.ts')
    expect(output).to.contain('Created .gitignore and added .twigx-worktrees')

    const configContent = await fs.readFile(path.join(tempDir, '.twigconfig.ts'), 'utf8')
    expect(configContent).to.contain('export default config;')
    expect(configContent).to.contain('.twigx-worktrees')

    const gitignoreContent = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8')
    expect(gitignoreContent).to.contain('.twigx-worktrees')
  })

  it('overwrites .twigconfig.ts when --force is used', async () => {
    // create a dummy config
    await fs.writeFile(path.join(tempDir, '.twigconfig.ts'), 'dummy')

    const {stderr, stdout} = await runCommand('init --force')
    expect(stdout + stderr).to.contain('Overwrote existing .twigconfig.ts')

    const configContent = await fs.readFile(path.join(tempDir, '.twigconfig.ts'), 'utf8')
    expect(configContent).to.not.equal('dummy')
    expect(configContent).to.contain('export default config;')
  })

  it('does not overwrite without --force', async () => {
    await fs.writeFile(path.join(tempDir, '.twigconfig.ts'), 'dummy')

    const {stderr, stdout} = await runCommand('init')
    expect(stdout + stderr).to.contain('.twigconfig.ts already exists. Use --force to overwrite.')

    const configContent = await fs.readFile(path.join(tempDir, '.twigconfig.ts'), 'utf8')
    expect(configContent).to.equal('dummy')
  })
})
