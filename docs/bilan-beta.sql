-- Planify — bilan de la bêta (lecture seule). À lancer dans Supabase > SQL Editor,
-- ou demander à Claude « bilan bêta ». Changer la date de début si besoin.
-- Les événements dont le nom commence par « TEST » sont exclus (tests de Manou).
with e as (
  select id, event_type, nb_participants, created_at from events
  where created_at >= '2026-10-05' and event_name not ilike 'test%'
), p as (
  select event_id, count(*) reponses, min(date_reponse) premiere,
         sum(case when rsvp_status = 'Confirmé' then coalesce(nb_personnes,1) else 0 end) viennent
  from participants group by 1
), i as (
  select event_id, count(*) articles,
         count(*) filter (where assigned_to is not null or assigned_participant_id is not null) pris
  from items group by 1
)
select
  count(*)                                                                    as evenements_crees,
  count(*) filter (where coalesce(p.reponses,0) > 0)                          as evenements_avec_reponses,
  round(100.0 * count(*) filter (where coalesce(p.reponses,0) > 0) / nullif(count(*),0)) as pct_activation,        -- objectif >= 80
  round(avg(coalesce(p.reponses,0)),1)                                         as reponses_par_evenement,          -- objectif >= 6
  round(100.0 * sum(coalesce(p.viennent,0)) / nullif(sum(e.nb_participants),0)) as pct_personnes_confirmees,       -- objectif >= 60
  round(100.0 * sum(coalesce(i.pris,0)) / nullif(sum(i.articles),0))          as pct_apports_reserves,             -- objectif >= 50
  round(extract(epoch from percentile_cont(0.5) within group (order by p.premiere - e.created_at))/3600, 1)
                                                                               as heures_mediane_1re_reponse       -- objectif <= 24
from e left join p on p.event_id = e.id left join i on i.event_id = e.id;
