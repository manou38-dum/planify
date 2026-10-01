'use client'
import { useState } from 'react'
import Link from 'next/link'

// Vitrine de la page d'accueil : textes et visuels uniquement, aucune logique métier.
// Règle : ne rien promettre que Planify ne fait pas (pas d'envoi automatique, pas de paiement, pas de rappel automatique).

export function CtaButton({ children = 'Organiser mon événement', className = '' }) {
  return (
    <Link href="/create" className={`flex items-center justify-center gap-2 min-h-[56px] px-6 rounded-2xl bg-orange-700 hover:bg-orange-800 text-white text-lg font-bold shadow-sm transition-colors ${className}`}>
      {children}<span aria-hidden="true">→</span>
    </Link>
  )
}

// Ce que Planify gère, affiché d'un coup d'œil sous l'accroche.
const FEATURES = ['Invitations', 'Réponses', 'Qui apporte quoi', 'Bénévoles et créneaux', 'Matériel', 'Covoiturage']

export function Hero({ ctaRef }) {
  return (
    <section aria-labelledby="titre" className="pt-2">
      <p className="text-sm font-semibold text-orange-800">Fête · Sortie · Tournoi · Club · Association</p>
      <h1 id="titre" className="mt-2 text-[2.1rem] leading-[1.08] sm:text-5xl font-extrabold tracking-tight text-stone-900">
        Tout ton événement,<br /><span className="text-orange-700">organisé de A à Z.</span>
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-stone-700">
        Planify prépare l’invitation, les listes, les postes de bénévoles et le covoiturage. Tu partages un seul lien : chacun répond, choisit ce qu’il apporte ou son créneau, et tu vois tout d’un coup d’œil.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Ce que Planify organise">
        {FEATURES.map(feature => (
          <li key={feature} className="text-sm font-semibold text-stone-800 bg-white ring-1 ring-stone-900/10 rounded-full px-3 py-1.5">
            <span aria-hidden="true" className="text-emerald-700">✓ </span>{feature}
          </li>
        ))}
      </ul>
      <div ref={ctaRef} className="mt-6">
        <CtaButton />
        <p className="mt-3 text-sm text-stone-600 text-center">Gratuit · Sans compte · Tes invités n’installent rien</p>
      </div>
    </section>
  )
}

// Aperçu de ce que voit l'organisateur, dessiné en HTML (net partout, aucun poids d'image).
// Trois exemples pour montrer que Planify ne se limite pas aux repas.
const DEMOS = {
  fete: {
    tab: '🔥 Barbecue',
    hero: 'from-orange-100 via-orange-200 to-orange-300', kicker: 'text-orange-900',
    title: '🔥 BBQ chez Manu', when: 'Samedi 14 h · Au jardin',
    stats: [['12', 'viennent', 'text-emerald-800'], ['3', 'sans réponse', 'text-amber-800'], ['3/5', 'apports pris', 'text-stone-900']],
    rows: [['Merguez et saucisses', 'Julie', true], ['Salade de pâtes', 'Karim', true], ['5 baguettes', 'à prendre', false], ['14 bouteilles d’eau', 'Léa', true], ['Chips et apéritif', 'à prendre', false]],
    alert: 'Il manque le pain et les chips',
  },
  tournoi: {
    tab: '🏆 Tournoi',
    hero: 'from-blue-100 via-blue-200 to-blue-300', kicker: 'text-blue-900',
    title: '🏆 Tournoi de foot du club', when: 'Dimanche 9 h · Stade municipal',
    stats: [['48', 'joueurs', 'text-emerald-800'], ['9', 'bénévoles', 'text-stone-900'], ['3', 'postes vides', 'text-amber-800']],
    rows: [['8 h 30 · Accueil des équipes', '2/2', true], ['9 h · Arbitrage des matchs', '4/4', true], ['9 h · Buvette et repas', '3/4', false], ['17 h · Rangement', '0/2', false], ['Covoiturage', '4 voitures', true]],
    alert: 'Il manque 3 bénévoles',
  },
  sortie: {
    tab: '🧭 Sortie',
    hero: 'from-teal-100 via-teal-200 to-teal-300', kicker: 'text-teal-900',
    title: '🧭 Rando au lac Blanc', when: 'Samedi 8 h · Parking du col',
    stats: [['9', 'viennent', 'text-emerald-800'], ['7/9', 'équipés', 'text-stone-900'], ['3', 'voitures', 'text-stone-900']],
    rows: [['Julie', 'équipée', true], ['Karim', 'manque : frontale', false], ['Léa', 'équipée', true], ['Covoiturage · Léa', '3 places', true], ['Tom', 'manque : veste', false]],
    alert: 'Karim et Tom pas équipés',
  },
}

export function PhoneDemo() {
  const [current, setCurrent] = useState('fete')
  const demo = DEMOS[current]
  return (
    <figure className="mx-auto w-full max-w-[20rem]" aria-label="Exemples d’événements organisés avec Planify">
      <div role="tablist" aria-label="Choisir un exemple" className="mb-3 grid grid-cols-3 gap-1 bg-white rounded-2xl p-1 ring-1 ring-stone-900/10">
        {Object.entries(DEMOS).map(([key, d]) => (
          <button key={key} type="button" role="tab" aria-selected={current === key} onClick={() => setCurrent(key)}
            className={`min-h-[44px] rounded-xl text-sm font-bold transition-colors ${current === key ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`}>
            {d.tab}
          </button>
        ))}
      </div>
      <div className="rounded-[2.2rem] bg-stone-900 p-2.5 shadow-xl" role="tabpanel">
        <div className="rounded-[1.7rem] bg-cream overflow-hidden">
          <div className={`bg-gradient-to-br ${demo.hero} px-4 pt-5 pb-4`}>
            <p className={`text-xs font-semibold ${demo.kicker}`}>Tableau de l’organisateur</p>
            <p className="text-xl font-extrabold text-stone-900 leading-tight">{demo.title}</p>
            <p className="text-sm text-stone-800">{demo.when}</p>
          </div>
          <div className="px-3 py-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              {demo.stats.map(([value, label, tone]) => (
                <div key={label} className="bg-white rounded-xl py-2 ring-1 ring-stone-900/5">
                  <p className={`text-lg font-extrabold ${tone}`}>{value}</p><p className="text-[11px] text-stone-600">{label}</p>
                </div>
              ))}
            </div>
            <ul className="bg-white rounded-xl ring-1 ring-stone-900/5 divide-y divide-stone-100 text-sm">
              {demo.rows.map(([name, status, done]) => (
                <li key={name} className="flex items-center gap-2 px-3 py-2">
                  <span aria-hidden="true" className={`w-5 h-5 shrink-0 rounded-full grid place-items-center text-[11px] font-bold ${done ? 'bg-emerald-600 text-white' : 'ring-2 ring-amber-500'}`}>{done ? '✓' : ''}</span>
                  <span className={`flex-1 min-w-0 ${done ? 'text-stone-600' : 'text-stone-900 font-semibold'}`}>{name}</span>
                  <span className={`shrink-0 text-xs font-semibold ${done ? 'text-emerald-800' : 'text-amber-800'}`}>{status}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-stone-900 text-white text-sm px-3 py-2.5 flex items-center justify-between gap-2">
              <span>{demo.alert}</span>
              <span className="font-bold text-orange-300">Relancer</span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-stone-600">Ce que tu vois, toi, l’organisateur.</figcaption>
    </figure>
  )
}

export function HowItWorks() {
  const steps = [
    { n: '1', title: 'Décris ton événement', text: 'En une phrase, même à la voix : « tournoi de foot dimanche 9 h au stade, 48 joueurs ». Planify prépare l’invitation, les listes, les postes et le planning.' },
    { n: '2', title: 'Partage le lien', text: 'Sur WhatsApp, par SMS ou par QR code. Tes invités ouvrent le lien : pas d’appli, pas de compte.' },
    { n: '3', title: 'Chacun répond et choisit', text: 'Oui ou non, avec qui, ce qu’il apporte, son créneau de bénévole ou sa place en covoiturage. Ce qui est pris n’est plus proposé : fini les doublons.' },
  ]
  return (
    <section aria-labelledby="comment" className="mt-14">
      <h2 id="comment" className="text-2xl font-extrabold tracking-tight">Comment ça marche</h2>
      <ol className="mt-5 space-y-4">
        {steps.map(step => (
          <li key={step.n} className="flex gap-4">
            <span aria-hidden="true" className="shrink-0 w-10 h-10 rounded-full bg-orange-700 text-white font-extrabold grid place-items-center">{step.n}</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">{step.title}</h3>
              <p className="text-stone-700 mt-1">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function EventTypes() {
  const types = [
    { emoji: '🔥', name: 'Barbecue, apéro, repas', text: 'Les quantités calculées pour ton nombre d’invités, et chacun réserve sa part.', tone: 'from-orange-100 to-orange-200' },
    { emoji: '🎂', name: 'Anniversaire', text: 'Les réponses des parents, des idées cadeaux réservables, et la surprise bien gardée.', tone: 'from-rose-100 to-rose-200' },
    { emoji: '🧭', name: 'Sortie, rando, vélo', text: 'Le matériel de chacun vérifié avant le départ, et le covoiturage organisé.', tone: 'from-teal-100 to-teal-200' },
    { emoji: '🏆', name: 'Tournoi, club, asso', text: 'Les postes de bénévoles adaptés à ton sport, avec les créneaux et les horaires.', tone: 'from-blue-100 to-blue-200' },
  ]
  return (
    <section aria-labelledby="pour-quoi" className="mt-14">
      <h2 id="pour-quoi" className="text-2xl font-extrabold tracking-tight">Pour tous tes événements</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {types.map(type => (
          <li key={type.name} className={`rounded-3xl bg-gradient-to-br ${type.tone} p-5`}>
            <p className="text-3xl" aria-hidden="true">{type.emoji}</p>
            <h3 className="mt-2 font-bold text-lg text-stone-900">{type.name}</h3>
            <p className="text-stone-800 mt-1">{type.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Pains() {
  const pains = [
    ['Trois paquets de chips et zéro pain.', 'Chacun voit ce qui est déjà pris et ce qui manque.'],
    ['« Je te dis demain. »', 'Une date limite de réponse, et tu vois combien n’ont pas encore répondu.'],
    ['Relancer tout le monde un par un.', 'Planify prépare le message avec ce qui manque. Tu l’envoies en un clic, à qui tu veux.'],
    ['Le groupe WhatsApp à 200 messages.', 'Les infos utiles au même endroit : qui vient, qui apporte quoi, où et quand.'],
  ]
  return (
    <section aria-labelledby="fini" className="mt-14 rounded-3xl bg-stone-900 text-white p-6">
      <h2 id="fini" className="text-2xl font-extrabold tracking-tight">Fini le bazar</h2>
      <ul className="mt-5 space-y-4">
        {pains.map(([before, after]) => (
          <li key={before}>
            <p className="text-stone-400 line-through decoration-stone-500">{before}</p>
            <p className="mt-0.5 font-semibold">{after}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Reassurance() {
  const points = [
    ['Gratuit', 'Sans publicité, sans abonnement.'],
    ['Sans compte', 'Ni pour toi, ni pour tes invités.'],
    ['C’est toi qui envoies', 'Rien ne part tout seul, aucun message en ton nom.'],
    ['Données protégées', 'Stockées en Europe, visibles seulement avec le lien, effacées 12 mois après l’événement.'],
  ]
  return (
    <section aria-labelledby="confiance" className="mt-14">
      <h2 id="confiance" className="sr-only">Pourquoi faire confiance à Planify</h2>
      <ul className="grid grid-cols-2 gap-3">
        {points.map(([title, text]) => (
          <li key={title} className="bg-white rounded-2xl ring-1 ring-stone-900/5 p-4">
            <p className="font-bold text-stone-900"><span aria-hidden="true" className="text-emerald-700">✓ </span>{title}</p>
            <p className="text-sm text-stone-600 mt-1">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
