import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

const LISTS_BY_TYPE = {
  BBQ: [
    { item_name: 'Merguez', category: 'Nourriture', per_person: 0.1, unit: 'kg', price_per_unit: 7 },
    { item_name: 'Saucisses', category: 'Nourriture', per_person: 0.1, unit: 'kg', price_per_unit: 6 },
    { item_name: 'Brochettes de poulet', category: 'Nourriture', per_person: 0.08, unit: 'kg', price_per_unit: 9 },
    { item_name: 'Pains à burger', category: 'Nourriture', per_person: 1.2, unit: 'pièces', price_per_unit: 0.25 },
    { item_name: 'Salade composée', category: 'Nourriture', per_person: 0.15, unit: 'pièces', price_per_unit: 3 },
    { item_name: 'Chips (grands paquets)', category: 'Nourriture', per_person: 0.15, unit: 'paquets', price_per_unit: 2.5 },
    { item_name: 'Pack de bières (24)', category: 'Boissons', per_person: 0.08, unit: 'packs', price_per_unit: 12 },
    { item_name: 'Rosé', category: 'Boissons', per_person: 0.15, unit: 'bouteilles', price_per_unit: 5 },
    { item_name: 'Sodas / jus de fruits', category: 'Boissons', per_person: 0.2, unit: 'bouteilles', price_per_unit: 2 },
    { item_name: 'Charbon de bois (5kg)', category: 'Matériel', per_person: 0, unit: 'sac', price_per_unit: 7.5, fixed: 1 },
    { item_name: 'Glaces (bacs)', category: 'Nourriture', per_person: 0.1, unit: 'bacs', price_per_unit: 4 },
    { item_name: 'Serviettes + assiettes', category: 'Matériel', per_person: 0, unit: 'lot', price_per_unit: 8, fixed: 1 },
  ],
  Anniversaire: [
    { item_name: 'Gâteau d\'anniversaire', category: 'Nourriture', per_person: 0, unit: 'pièce', price_per_unit: 35, fixed: 1 },
    { item_name: 'Champagne / Prosecco', category: 'Boissons', per_person: 0.2, unit: 'bouteilles', price_per_unit: 7 },
    { item_name: 'Jus de fruits', category: 'Boissons', per_person: 0.2, unit: 'bouteilles', price_per_unit: 2.5 },
    { item_name: 'Chips et apéritifs', category: 'Nourriture', per_person: 0.2, unit: 'paquets', price_per_unit: 2.5 },
    { item_name: 'Petits fours / verrines', category: 'Nourriture', per_person: 3, unit: 'pièces', price_per_unit: 0.3 },
    { item_name: 'Bougies anniversaire', category: 'Décoration', per_person: 0, unit: 'lot', price_per_unit: 3.5, fixed: 1 },
    { item_name: 'Assiettes + couverts', category: 'Matériel', per_person: 1.2, unit: 'sets', price_per_unit: 0.3 },
    { item_name: 'Gobelets', category: 'Matériel', per_person: 2, unit: 'pièces', price_per_unit: 0.1 },
    { item_name: 'Serviettes', category: 'Matériel', per_person: 0, unit: 'paquets', price_per_unit: 3, fixed: 2 },
    { item_name: 'Ballons déco', category: 'Décoration', per_person: 0, unit: 'lot', price_per_unit: 6, fixed: 1 },
  ],
  Tournoi: [
    { item_name: 'Eau minérale (1.5L)', category: 'Boissons', per_person: 1, unit: 'bouteilles', price_per_unit: 0.7 },
    { item_name: 'Sodas / Energy drinks', category: 'Boissons', per_person: 0.15, unit: 'packs', price_per_unit: 4 },
    { item_name: 'Sandwichs / Wraps', category: 'Nourriture', per_person: 1.2, unit: 'pièces', price_per_unit: 1.5 },
    { item_name: 'Barres énergétiques', category: 'Nourriture', per_person: 1.5, unit: 'pièces', price_per_unit: 0.6 },
    { item_name: 'Bananes', category: 'Nourriture', per_person: 0.1, unit: 'kg', price_per_unit: 1.8 },
    { item_name: 'Bières (post-match)', category: 'Boissons', per_person: 0.08, unit: 'packs 24', price_per_unit: 11 },
    { item_name: 'Chips / snacks', category: 'Nourriture', per_person: 0.2, unit: 'paquets', price_per_unit: 2 },
    { item_name: 'Gobelets', category: 'Matériel', per_person: 2.5, unit: 'pièces', price_per_unit: 0.08 },
    { item_name: 'Sacs poubelle', category: 'Matériel', per_person: 0, unit: 'pièces', price_per_unit: 0.5, fixed: 5 },
    { item_name: 'Glaçons (sac 5kg)', category: 'Matériel', per_person: 0, unit: 'sacs', price_per_unit: 2.5, fixed: 3 },
  ],
  Mariage: [
    { item_name: 'Champagne', category: 'Boissons', per_person: 0.25, unit: 'bouteilles', price_per_unit: 12 },
    { item_name: 'Vin blanc', category: 'Boissons', per_person: 0.15, unit: 'bouteilles', price_per_unit: 6 },
    { item_name: 'Vin rouge', category: 'Boissons', per_person: 0.15, unit: 'bouteilles', price_per_unit: 6 },
    { item_name: 'Jus / sodas', category: 'Boissons', per_person: 0.3, unit: 'bouteilles', price_per_unit: 2 },
    { item_name: 'Amuse-bouches', category: 'Nourriture', per_person: 5, unit: 'pièces', price_per_unit: 0.5 },
    { item_name: 'Pièce montée / dessert', category: 'Nourriture', per_person: 0, unit: 'pièce', price_per_unit: 80, fixed: 1 },
    { item_name: 'Dragées', category: 'Décoration', per_person: 1, unit: 'portions', price_per_unit: 1.5 },
    { item_name: 'Décoration table', category: 'Décoration', per_person: 0, unit: 'lot', price_per_unit: 30, fixed: 1 },
    { item_name: 'Bougies', category: 'Décoration', per_person: 0, unit: 'lot', price_per_unit: 15, fixed: 1 },
  ],
}

export async function POST(request) {
  try {
    const { event_id, event_type, nb_participants } = await request.json()

    // Utiliser les templates de liste par type (V1 sans appel IA pour simplifier)
    const template = LISTS_BY_TYPE[event_type] || LISTS_BY_TYPE['BBQ']
    const n = nb_participants || 20

    const itemsToInsert = template.map(item => {
      const quantity = item.fixed
        ? item.fixed
        : Math.ceil(item.per_person * n)
      const price = Math.round(quantity * item.price_per_unit * 100) / 100

      return {
        event_id,
        item_name: item.item_name,
        category: item.category,
        quantity,
        unit: item.unit,
        estimated_price: price,
        status: 'Disponible',
        ai_generated: true,
      }
    })

    const { error } = await getSupabase
      .from('items')
      .insert(itemsToInsert)

    if (error) throw error

    return Response.json({ success: true, items_count: itemsToInsert.length })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
