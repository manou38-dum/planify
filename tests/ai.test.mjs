import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import test from 'node:test'

async function run(provider, task) {
  const calls = []
  const context = vm.createContext({ process: { env: { AI_PROVIDER: provider, MISTRAL_API_KEY: 'test', ANTHROPIC_API_KEY: 'test' } } })
  const mocks = {
    '@anthropic-ai/sdk': new vm.SyntheticModule(['default'], function () {
      this.setExport('default', class { messages = { create: async args => { calls.push(args); return { content: [{ type: 'text', text: 'ok' }] } } } })
    }, { context }),
    '@mistralai/mistralai': new vm.SyntheticModule(['Mistral'], function () {
      this.setExport('Mistral', class { chat = { complete: async args => { calls.push(args); return { choices: [{ message: { content: 'ok' } }] } } } })
    }, { context }),
  }
  const mod = new vm.SourceTextModule(await readFile(new URL('../lib/ai.js', import.meta.url), 'utf8'), { context })
  await mod.link(name => mocks[name])
  await mod.evaluate()
  await mod.namespace.generateText({ system: 'test', user: 'test', task })
  return calls[0].model
}

test('Mistral uses its conversation and list models', async () => {
  assert.equal(await run(' MISTRAL ', 'conversation'), 'mistral-small-latest')
  assert.equal(await run('mistral', 'list'), 'mistral-large-latest')
})
test('Anthropic list generation never receives a Mistral model', async () => {
  assert.equal(await run('anthropic', 'list'), 'claude-haiku-4-5-20251001')
})
test('unknown providers fail explicitly', async () => {
  await assert.rejects(run('typo', 'list'), /Fournisseur IA non reconnu/)
})
