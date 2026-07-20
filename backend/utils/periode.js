// Règle unique de découpage de l'année universitaire, utilisée partout où une
// date doit être rattachée à une période (année_universitaire + semestre) :
// Semestre 1 : septembre → janvier — Semestre 2 : février → août.

export function getPeriodeDeDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const mois = d.getMonth() + 1 // 1-12
  const anneeDebut = mois >= 9 ? d.getFullYear() : d.getFullYear() - 1
  return {
    annee_universitaire: `${anneeDebut}/${anneeDebut + 1}`,
    semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2',
  }
}

export function getPeriodeActuelle() {
  return getPeriodeDeDate(new Date())
}

// Bornes [debut, fin) d'une période, pour filtrer des colonnes date/datetime en SQL.
// portee vaut 'S1', 'S2' ou 'annuel' (année complète = S1 + S2).
export function getBornesPeriode(anneeUniversitaire, portee) {
  const anneeDebut = Number(String(anneeUniversitaire).split('/')[0])
  if (portee === 'S1') {
    return { debut: `${anneeDebut}-09-01`, fin: `${anneeDebut + 1}-02-01` }
  }
  if (portee === 'S2') {
    return { debut: `${anneeDebut + 1}-02-01`, fin: `${anneeDebut + 1}-09-01` }
  }
  // 'annuel' : les deux semestres de l'année universitaire
  return { debut: `${anneeDebut}-09-01`, fin: `${anneeDebut + 1}-09-01` }
}