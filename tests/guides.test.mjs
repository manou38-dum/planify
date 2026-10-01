import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { GUIDES } from '../app/guides/guides.mjs'

test('chaque guide a une page, un titre court et une description utile', () => {
  const slugs = GUIDES.map(g => g.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const g of GUIDES) {
    assert.ok(existsSync(new URL(`../app/guides/${g.slug}/page.js`, import.meta.url)), g.slug)
    assert.ok(g.title.length <= 70, `titre trop long : ${g.title}`)
    assert.ok(g.description.length >= 80 && g.description.length <= 170, `description : ${g.slug}`)
  }
})

test('les pages privées ne sont jamais proposées aux moteurs de recherche', () => {
  const sitemap = readFileSync(new URL('../app/sitemap.js', import.meta.url), 'utf8')
  assert.doesNotMatch(sitemap, /\/invite|\/event/)
  assert.match(readFileSync(new URL('../app/event/[id]/layout.js', import.meta.url), 'utf8'), /index: false/)
  assert.match(readFileSync(new URL('../app/invite/[linkId]/page.js', import.meta.url), 'utf8'), /robots: NOINDEX/)
})
