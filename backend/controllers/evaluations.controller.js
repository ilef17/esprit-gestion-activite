import { getScores, calculerScoresEquipe, getGrilleNotes } from '../models/evaluationScore.model.js'

export async function listScores(req, res) {
  try {
    const { sous_equipe, type, annee, semestre } = req.query
    const scores = await getScores({
      sousEquipeId: sous_equipe,
      type: type === 'hors_up' ? 'hors_up' : 'up',
      annee_universitaire: annee,
      semestre,
    })
    res.json(scores)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function getGrille(req, res) {
  try {
    const { sous_equipe, type } = req.query
    if (!sous_equipe) return res.status(400).json({ message: 'sous_equipe requis.' })
    const grille = await getGrilleNotes(sous_equipe, type === 'hors_up' ? 'hors_up' : 'up')
    res.json(grille)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function calculerScores(req, res) {
  try {
    const { id_sous_equipe, notes, type } = req.body
    if (!id_sous_equipe) return res.status(400).json({ message: 'id_sous_equipe requis.' })
    const results = await calculerScoresEquipe(id_sous_equipe, notes || {}, type === 'hors_up' ? 'hors_up' : 'up')
    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}