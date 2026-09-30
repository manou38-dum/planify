import assert from 'node:assert/strict'
import test from 'node:test'
import { photoStoragePath, retentionCutoff } from '../lib/event-retention.mjs'

test('retention cutoff keeps events until their first birthday', () => {
  assert.equal(retentionCutoff(new Date('2026-09-30T03:17:00.000Z')).toISOString(), '2025-09-30T03:17:00.000Z')
})

test('only Planify public event photos are selected for removal', () => {
  assert.equal(
    photoStoragePath('https://example.supabase.co/storage/v1/object/public/event-photos/1750000000-bbq%20photo.jpg'),
    '1750000000-bbq photo.jpg',
  )
  assert.equal(photoStoragePath('https://example.com/image.jpg'), null)
  assert.equal(photoStoragePath('not a url'), null)
})
