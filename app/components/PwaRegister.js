'use client'
import { useEffect } from 'react'

// Enregistre le service worker (installation sur l'écran d'accueil + page hors connexion).
export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
