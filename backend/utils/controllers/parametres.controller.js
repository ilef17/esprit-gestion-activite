import { getParametres, updateParametres, ajouterAnneeSupplementaire } from '../models/parametreSysteme.model.js'

export async function fetchParametres(req, res) {
  try {
    const parametres = await getParametres()
    res.json(parametres)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function editParametres(req, res) {
  try {
    if (req.body.limite_taches_collaborateur !== undefined) {
      const limite = Number(req.body.limite_taches_collaborateur)
      if (!Number.isInteger(limite) || limite < 1) {
        return res.status(400).json({ message: 'La limite de tâches actives doit être un entier positif.' })
      }
    }
    const updated = await updateParametres(req.body)
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Ajoute une année universitaire au sélecteur (page Paramètres) — ex. "2027/2028".
export async function ajouterAnnee(req, res) {
  try {
    const { annee } = req.body
    if (!annee || !/^\d{4}\/\d{4}$/.test(String(annee).trim())) {
      return res.status(400).json({ message: 'Format attendu : AAAA/AAAA (ex. 2027/2028)' })
    }
    const updated = await ajouterAnneeSupplementaire(String(annee).trim())
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}