// Aiguilleur IA : bascule entre Mistral (dev, gratuit) et Anthropic (prod) via AI_PROVIDER.
// Expose une seule fonction generateText qui renvoie une CHAÎNE de texte, quel que soit le fournisseur.

import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'

export async function generateText({ system, user, temperature = 0.7, maxTokens = 1000, model, task = 'conversation' }) {
  const provider = (process.env.AI_PROVIDER || 'anthropic').trim().toLowerCase()
  if (!['mistral', 'anthropic'].includes(provider)) {
    throw new Error('Fournisseur IA non reconnu')
  }

  if (provider === 'mistral') {
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error('Clé API manquante pour le provider ' + provider)
    }
    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })
    const response = await client.chat.complete({
      model: model || (task === 'list' ? 'mistral-large-latest' : 'mistral-small-latest'),
      temperature,
      maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    const c = response.choices?.[0]?.message?.content
    return Array.isArray(c)
      ? c.map(p => (typeof p === 'string' ? p : p?.text || '')).join('')
      : (c || '')
  }

  // anthropic (défaut)
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Clé API manquante pour le provider ' + provider)
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model: model || 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: 'user', content: user }],
  })
  return message.content.find(b => b.type === 'text')?.text || ''
}
