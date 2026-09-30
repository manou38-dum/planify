import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createOrganizerToken, organizerTokenHash } from '../lib/event-access.js'

test('organizer tokens are strong and only their hash is stored', async () => {
  const token = createOrganizerToken()
  assert.match(token, /^[a-f0-9]{64}$/)
  assert.equal(await organizerTokenHash('test'), '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')
})

test('RLS migration has no public access policy and covers every event table', async () => {
  const sql = await readFile(new URL('../security-rls.sql', import.meta.url), 'utf8')
  assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)/i)
  for (const table of ['events', 'participants', 'items', 'lists', 'slots', 'slot_signups', 'carpool', 'checklist_validations']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
  }
})
