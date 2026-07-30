// Power BI Desktop (connecteur "Web") ne sait pas faire un login JWT interactif —
// on protège donc ces endpoints en lecture seule par une clé simple passée en
// query string (?key=...), à définir dans POWERBI_API_KEY côté .env.
export function requireApiKey(req, res, next) {
  const expected = process.env.POWERBI_API_KEY
  if (!expected) {
    return res.status(503).json({ message: "POWERBI_API_KEY n'est pas configurée côté serveur." })
  }
  const provided = req.query.key
  if (!provided || provided !== expected) {
    return res.status(401).json({ message: 'Clé API manquante ou invalide (paramètre ?key=...).' })
  }
  next()
}
