import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFreeEvent } from '../lib/free-mode.mjs'

async function handler(generateText, local = false) {
  const context = vm.createContext({ Response, console: { error() {} } })
  const ai = new vm.SyntheticModule(['generateText'], function () {
    this.setExport('generateText', generateText)
  }, { context })
  const source = await readFile(new URL('../app/api/parse-voice/route.js', import.meta.url), 'utf8')
  const route = new vm.SourceTextModule(source, { context })
  const free = new vm.SyntheticModule(['parseFreeEvent', 'useFreeMode'], function () {
    this.setExport('parseFreeEvent', parseFreeEvent)
    this.setExport('useFreeMode', () => local)
  }, { context })
  await route.link(name => name.includes('free-mode') ? free : ai)
  await route.evaluate()
  return route.namespace.POST
}

test('free route keeps the event date when answering the deadline and never calls a provider', async () => {
  const post = await handler(() => { throw new Error('External call forbidden') }, true)
  const response = await post({ json: async () => ({ transcript: '2 jours avant', current: { date: '2026-10-19T14:00' }, pending_field: 'deadline_rsvp' }) })
  const data = await response.json()
  assert.equal(response.status, 200)
  assert.equal(data.deadline_rsvp, '2026-10-17T12:00')
  assert.equal(data.date, undefined)
})

for (const status of [401, 429, 500]) {
  test(`provider ${status} is an explicit failure, never an empty success`, async () => {
    const post = await handler(async () => { throw Object.assign(new Error('private upstream detail'), { statusCode: status }) })
    const response = await post({ json: async () => ({ transcript: 'bbq samedi chez moi a chambery' }) })
    assert.equal(response.status, status === 429 ? 429 : 503)
    const data = await response.json()
    assert.ok(data.error)
    assert.equal(data.follow_up_question, undefined)
    assert.ok(!JSON.stringify(data).includes('private upstream detail'))
  })
}

test('successful extraction preserves the event data', async () => {
  const post = await handler(async () => JSON.stringify({ event_type: 'BBQ', location: 'chez moi à Chambéry', date: '2026-10-03T12:00', organizer_name: 'Numa' }))
  const response = await post({ json: async () => ({ transcript: 'Numa le 3 octobre à 12h', current: { location: 'chez moi à Chambéry' } }) })
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.organizer_name, 'Numa')
  assert.equal(data.location, 'chez moi à Chambéry')
  assert.equal(data.date, '2026-10-03T12:00')
})
