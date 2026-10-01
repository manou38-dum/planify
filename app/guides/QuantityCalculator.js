'use client'
import { useState } from 'react'
import { freeLists } from '@/lib/free-mode.mjs'
import { formatQuantity } from '@/lib/ui-theme.mjs'

// Calculateur public : mêmes calculs que l'application (freeLists), affiché sans rien enregistrer.
// Rendu côté serveur avec la valeur par défaut, donc lisible par les moteurs de recherche.
export default function QuantityCalculator({ type, keys, defaultCount = 20, options = {}, allowGenerous = true }) {
  const [count, setCount] = useState(defaultCount)
  const [generous, setGenerous] = useState(false)
  const n = Math.max(1, Math.min(500, Number(count) || 1))
  const { lists, menu_resume } = freeLists(keys, n, { ...options, appetite: generous ? 'generous' : undefined }, type)
  const step = delta => setCount(c => Math.max(1, Math.min(500, (Number(c) || 0) + delta)))

  return (
    <section aria-labelledby="calculateur" className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-5 space-y-4">
      <h2 id="calculateur" className="text-lg font-bold">Calcule pour ton groupe</h2>
      <div className="flex items-center gap-3">
        <label htmlFor="nb" className="font-semibold">Nombre de personnes</label>
        <div className="flex items-center ml-auto">
          <button type="button" onClick={() => step(-5)} aria-label="5 personnes de moins" className="w-11 h-11 rounded-xl bg-stone-100 font-bold text-lg">−</button>
          <input id="nb" type="number" inputMode="numeric" min="1" max="500" value={count}
            onChange={e => setCount(e.target.value)}
            className="w-16 h-11 mx-2 text-center text-lg font-bold rounded-xl ring-1 ring-stone-300" />
          <button type="button" onClick={() => step(5)} aria-label="5 personnes de plus" className="w-11 h-11 rounded-xl bg-stone-100 font-bold text-lg">+</button>
        </div>
      </div>
      {allowGenerous && (
        <label className="flex items-center gap-3 min-h-[44px]">
          <input type="checkbox" checked={generous} onChange={e => setGenerous(e.target.checked)} className="w-5 h-5 accent-orange-700" />
          <span>Gros mangeurs (+30 % sur la nourriture)</span>
        </label>
      )}
      {lists.map(list => (
        <div key={list.list_name}>
          <h3 className="font-bold text-stone-900 mt-2 mb-2">{list.list_name.replace(' à personnaliser', '').replace(' à vérifier avant achat', '')}</h3>
          <ul className="divide-y divide-stone-100">
            {list.items.map(item => (
              <li key={item.item_name} className="flex items-baseline justify-between gap-3 py-2">
                <span>{item.item_name}</span>
                <span className="shrink-0 font-semibold text-right">{formatQuantity(item.quantity)} {item.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {menu_resume && <p className="text-sm text-stone-600">{menu_resume}</p>}
    </section>
  )
}
