import { getParametres, updateParametres } from '../models/parametreSysteme.model.js'

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
    const updated = await updateParametres(req.body)
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
