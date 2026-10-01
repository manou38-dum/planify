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

export function Hero({ ctaRef }) {
  return (
    <section aria-labelledby="titre" className="pt-2">
      <p className="text-sm font-semibold text-orange-800">Barbecue · Anniversaire · Sortie · Tournoi</p>
      <h1 id="titre" className="mt-2 text-[2rem] leading-[1.1] sm:text-5xl font-extrabold tracking-tight text-stone-900">
        Qui vient&nbsp;? Qui apporte quoi&nbsp;?<br /><span className="text-orange-700">Planify s’en occupe.</span>
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-stone-700">
        Tu crées l’invitation en 2 minutes et tu la partages sur WhatsApp. Chacun répond en un clic et réserve ce qu’il apporte. Toi, tu vois tout d’un coup d’œil.
      </p>
      <div ref={ctaRef} className="mt-6">
        <CtaButton />
        <p className="mt-3 text-sm text-stone-600 text-center">Gratuit · Sans compte · Tes invités n’installent rien</p>
      </div>
    </section>
  )
}

// Aperçu d'un événement, dessiné en HTML : net sur tous les écrans, aucun poids d'image.
export function PhoneDemo() {
  const items = [
    { name: 'Merguez et saucisses', who: 'Julie', done: true },
    { name: 'Salade de pâtes', who: 'Karim', done: true },
    { name: '5 baguettes', who: null, done: false },
    { name: '14 bouteilles d’eau', who: 'Léa', done: true },
    { name: 'Chips et apéritif', who: null, done: false },
  ]
  return (
    <figure className="mx-auto w-full max-w-[20rem]" aria-label="Exemple : un barbecue organisé avec Planify">
      <div className="rounded-[2.2rem] bg-stone-900 p-2.5 shadow-xl">
        <div className="rounded-[1.7rem] bg-cream overflow-hidden">
          <div className="bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 px-4 pt-5 pb-4">
            <p className="text-xs font-semibold text-orange-900">Manu t’invite</p>
            <p className="text-xl font-extrabold text-stone-900 leading-tight">🔥 BBQ chez Manu</p>
            <p className="text-sm text-stone-800">Samedi 14 h · Au jardin</p>
          </div>
          <div className="px-3 py-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-xl py-2 ring-1 ring-stone-900/5"><p className="text-lg font-extrabold text-emerald-800">12</p><p className="text-[11px] text-stone-600">viennent</p></div>
              <div className="bg-white rounded-xl py-2 ring-1 ring-stone-900/5"><p className="text-lg font-extrabold text-amber-800">3</p><p className="text-[11px] text-stone-600">sans réponse</p></div>
              <div className="bg-white rounded-xl py-2 ring-1 ring-stone-900/5"><p className="text-lg font-extrabold text-stone-900">3/5</p><p className="text-[11px] text-stone-600">apports pris</p></div>
            </div>
            <ul className="bg-white rounded-xl ring-1 ring-stone-900/5 divide-y divide-stone-100 text-sm">
              {items.map(item => (
                <li key={item.name} className="flex items-center gap-2 px-3 py-2">
                  <span aria-hidden="true" className={`w-5 h-5 shrink-0 rounded-full grid place-items-center text-[11px] font-bold ${item.done ? 'bg-emerald-600 text-white' : 'ring-2 ring-amber-500'}`}>{item.done ? '✓' : ''}</span>
                  <span className={`flex-1 ${item.done ? 'text-stone-500 line-through decoration-stone-300' : 'text-stone-900 font-semibold'}`}>{item.name}</span>
                  <span className={`text-xs ${item.done ? 'text-emerald-800 font-semibold' : 'text-amber-800 font-semibold'}`}>{item.who || 'à prendre'}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-stone-900 text-white text-sm px-3 py-2.5 flex items-center justify-between">
              <span>Il manque le pain et les chips</span>
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
    { n: '1', title: 'Décris ton événement', text: 'En une phrase, même à la voix : « BBQ samedi 14 h chez moi, 15 personnes ». Planify prépare l’invitation et la liste de ce qu’il faut.' },
    { n: '2', title: 'Partage le lien', text: 'Sur WhatsApp, par SMS ou par QR code. Tes invités ouvrent le lien : pas d’appli, pas de compte.' },
    { n: '3', title: 'Chacun répond et choisit', text: 'Oui ou non, avec qui, et ce qu’il apporte. Ce qui est pris n’est plus proposé : fini les doublons.' },
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
