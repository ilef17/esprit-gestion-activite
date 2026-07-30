// Avertissements de date réutilisés partout où l'utilisateur choisit une date (tâches,
// activité hors-équipe, activité école...). Ce sont des avertissements non bloquants :
// on informe l'utilisateur, on ne l'empêche pas de saisir une date passée volontairement
// (ex. régularisation a posteriori), sauf pour l'incohérence début > fin qui est toujours
// une erreur de saisie.

function today0h() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// Avertissement pour une date unique (ex. échéance, date limite) : signale une date déjà
// passée. Retourne null si la date est vide ou dans le futur/aujourd'hui.
export function warningDateSeule(date) {
  const d = parseDate(date)
  if (!d) return null
  return d < today0h() ? 'Cette date est déjà passée.' : null
}

// Avertissement pour une paire début/fin : incohérence (début après fin) prioritaire,
// sinon signale si le début est déjà passé.
export function warningPeriode(dateDebut, dateFin) {
  const debut = parseDate(dateDebut)
  const fin = parseDate(dateFin)
  if (debut && fin && debut > fin) {
    return 'La date de début est après la date de fin.'
  }
  if (debut && debut < today0h()) {
    return 'La date de début est déjà passée.'
  }
  return null
}