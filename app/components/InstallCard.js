'use client'
import { useEffect, useState } from 'react'

const DISMISS_KEY = 'planify.install-dismissed.v1'

// Carte « Mettre Planify sur mon téléphone » : bouton d'installation sur Android et ordinateur,
// mode d'emploi sur iPhone (Safari ne propose pas de bouton). Masquée si déjà installée ou refermée.
export default function InstallCard() {
  const [mode, setMode] = useState(null) // 'prompt' | 'ios' | null
  const [prompt, setPrompt] = useState(null)
  const [steps, setSteps] = useState(false)

  useEffect(() => {
    let dismissed = false
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1' } catch {}
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (dismissed || standalone) return
    const ua = window.navigator.userAgent
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
    if (ios) { setMode('ios'); return }
    const onPrompt = event => { event.preventDefault(); setPrompt(event); setMode('prompt') }
    const onInstalled = () => setMode(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!mode) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setMode(null)
  }
  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice.catch(() => null)
    setPrompt(null)
    setMode(null)
  }

  return (
    <aside aria-labelledby="installer" className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-5 mb-8">
      <div className="flex items-start gap-4">
        <img src="/icons/icon-192.png" alt="" width="48" height="48" className="rounded-xl shrink-0" />
        <div className="min-w-0">
          <h2 id="installer" className="font-bold text-lg">Mets Planify sur ton téléphone</h2>
          <p className="text-stone-700 mt-1">Une icône sur ton écran d’accueil, en plein écran, comme une appli. Gratuit, sans store, rien à télécharger.</p>
        </div>
      </div>
      {mode === 'prompt' && (
        <button type="button" onClick={install} className="mt-4 w-full min-h-[52px] rounded-2xl bg-orange-700 hover:bg-orange-800 text-white font-bold">
          Installer Planify
        </button>
      )}
      {mode === 'ios' && (
        steps ? (
          <ol className="mt-4 space-y-2 list-decimal pl-5">
            <li>Ouvre cette page dans <strong>Safari</strong>.</li>
            <li>Touche le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut).</li>
            <li>Choisis <strong>« Sur l’écran d’accueil »</strong>, puis <strong>Ajouter</strong>.</li>
          </ol>
        ) : (
          <button type="button" onClick={() => setSteps(true)} className="mt-4 w-full min-h-[52px] rounded-2xl bg-orange-700 hover:bg-orange-800 text-white font-bold">
            Comment faire sur iPhone
          </button>
        )
      )}
      <button type="button" onClick={dismiss} className="mt-2 w-full min-h-[44px] text-stone-600 font-semibold">
        Plus tard
      </button>
    </aside>
  )
}
