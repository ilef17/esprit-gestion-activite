import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { spawn } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

export const BACKUPS_DIR = path.join(process.cwd(), 'generated', 'sauvegardes')

function ensureBackupsDir() {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true })
}

// Calcule le SHA-256 d'un fichier — sert de "contrôle d'intégrité" : on peut
// recomparer ce hash plus tard pour détecter un fichier corrompu/altéré.
export function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

// Lance `mysqldump` sur la base configurée dans .env et écrit le résultat
// dans generated/sauvegardes/<timestamp>.sql. Nécessite que le client MySQL
// (mysqldump) soit installé et accessible dans le PATH du serveur, ou que
// MYSQLDUMP_PATH pointe vers son binaire.
export function runMysqldump(filePath) {
  return new Promise((resolve, reject) => {
    const bin = process.env.MYSQLDUMP_PATH || 'mysqldump'
    const args = [
      `--host=${process.env.DB_HOST || 'localhost'}`,
      `--user=${process.env.DB_USER || 'root'}`,
      '--single-transaction',
      '--routines',
      '--events',
      process.env.DB_NAME || 'esprittech',
    ]

    const env = { ...process.env }
    if (process.env.DB_PASSWORD) env.MYSQL_PWD = process.env.DB_PASSWORD

    const out = fs.createWriteStream(filePath)
    const child = spawn(bin, args, { env })

    let stderr = ''
    child.stdout.pipe(out)
    child.stderr.on('data', (d) => { stderr += d.toString() })

    child.on('error', (err) => {
      // Cas le plus courant sur un poste de dev : mysqldump absent du PATH.
      reject(new Error(`Impossible de lancer mysqldump (${err.message}). Vérifiez qu'il est installé et dans le PATH, ou renseignez MYSQLDUMP_PATH dans .env.`))
    })

    child.on('close', (code) => {
      out.close()
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `mysqldump a quitté avec le code ${code}`))
    })
  })
}

// Crée une sauvegarde complète : dump SQL + hash d'intégrité. Retourne les
// métadonnées à persister en base (table `sauvegarde`).
export async function creerSauvegarde({ type = 'manuelle' } = {}) {
  ensureBackupsDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const nomFichier = `arp-backup-${timestamp}.sql`
  const filePath = path.join(BACKUPS_DIR, nomFichier)

  try {
    await runMysqldump(filePath)
    const { size } = fs.statSync(filePath)
    const checksum = await sha256File(filePath)
    return { nom_fichier: nomFichier, taille_octets: size, checksum_sha256: checksum, type, statut: 'ok', message_erreur: null }
  } catch (err) {
    // On garde une trace de l'échec (fichier vide éventuel nettoyé) plutôt que
    // de faire disparaître silencieusement la tentative.
    fs.unlink(filePath, () => {})
    return { nom_fichier: nomFichier, taille_octets: 0, checksum_sha256: null, type, statut: 'echec', message_erreur: err.message }
  }
}

// Recalcule le hash du fichier stocké et le compare à celui enregistré au
// moment de la création — permet de vérifier qu'une sauvegarde n'a pas été
// corrompue ou altérée depuis.
export async function verifierIntegrite(nomFichier, checksumAttendu) {
  const filePath = path.join(BACKUPS_DIR, nomFichier)
  if (!fs.existsSync(filePath)) {
    return { existe: false, intact: false, checksum_actuel: null }
  }
  const checksumActuel = await sha256File(filePath)
  return { existe: true, intact: checksumActuel === checksumAttendu, checksum_actuel: checksumActuel }
}
