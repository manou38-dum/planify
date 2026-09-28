import { freeLists } from './free-mode.mjs'
export function quantityReview(event, participants, items) {
 const confirmed = participants.filter(p => p.rsvp_status === 'Confirmé').reduce((sum, p) => sum + Math.max(1, Number(p.nb_personnes) || 1), 0)
 const people = Math.max(Number(event.nb_participants) || 1, confirmed)
 const options = event.event_options || {}
 const keys = Object.entries(options.selected_lists || { menu: true, boissons: true, materiel: true }).filter(([, value]) => value).map(([key]) => key)
 const targets = freeLists(keys, people, options, event.event_type).lists.flatMap(list => list.items)
 const norm = value => String(value || '').trim().toLocaleLowerCase('fr')
 const additions = targets.flatMap(target => {
   const matches = items.filter(item => norm(item.item_name) === norm(target.item_name) && norm(item.unit) === norm(target.unit))
   // Do not reintroduce items deliberately removed or renamed by the organizer.
   if (!matches.length) return []
   const listed = matches.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0)
   const quantity = Math.round(Math.max(0, target.quantity - listed) * 100) / 100
   return quantity > 0 ? [{ ...target, quantity }] : []
 })
 return { people, confirmed, additions }
}
