import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'

test('shared lists refresh for separate viewers, survive failures and stop when hidden or unmounted', async () => {
  const intervals = new Set(), effects = [], events = new Map()
  const source = { items: [{ id: 'bread' }], lists: [], error: false, calls: 0 }
  const document = { visibilityState: 'visible', addEventListener: (key, fn) => events.set(fn,key), removeEventListener: (_,fn) => events.delete(fn) }
  const context = vm.createContext({ AbortController, document, window: document, setInterval: fn => { intervals.add(fn); return fn }, clearInterval: fn => intervals.delete(fn) })
  const client = { from(table) { const q = { select: () => q, eq: () => q, order: () => q, abortSignal: async () => { source.calls++; return source.error ? { error: new Error('offline') } : { data: [...source[table]] } } }; return q } }
  const mocks = {
    react: new vm.SyntheticModule(['useEffect'],function(){this.setExport('useEffect', fn=>effects.push(fn))},{context}),
    './supabase': new vm.SyntheticModule(['getSupabase'],function(){this.setExport('getSupabase', ()=>client)},{context}),
  }
  const mod = new vm.SourceTextModule(await readFile(new URL('../lib/use-shared-items.js',import.meta.url),'utf8'),{context})
  await mod.link(name=>mocks[name]); await mod.evaluate()
  let guest, organizer
  mod.namespace.useSharedItems('event',value=>guest=value,()=>{})
  mod.namespace.useSharedItems('event',value=>organizer=value,()=>{})
  const cleanups = effects.map(fn=>fn())
  await new Promise(resolve=>setImmediate(resolve))
  source.items.push({id:'guest-addition'})
  await Promise.all([...intervals].map(fn=>fn()))
  assert.equal(guest.length,2); assert.equal(organizer.length,2)
  source.error = true
  await Promise.all([...intervals].map(fn=>fn()))
  assert.equal(guest.length,2)
  document.visibilityState = 'hidden'; const calls=source.calls
  await Promise.all([...intervals].map(fn=>fn())); assert.equal(source.calls,calls)
  cleanups.forEach(fn=>fn()); assert.equal(intervals.size,0); assert.equal(events.size,0)
  effects.length=0
  mod.namespace.useSharedItems('event',()=>assert.fail('paused'),()=>{},true)
  assert.equal(effects[0](),undefined)
})

