import pool from '../config/db.js'

// Auto-provisionne au démarrage les éléments de schéma dont dépendent les
// notifications, sans exiger de migration SQL manuelle : la table `notification`
// (si absente) et la colonne `tache.rappel_echeance_envoye` (si absente sur une
// base créée avant son ajout). Chaque étape est idempotente et sans danger à
// relancer à chaque démarrage du serveur.

async function colonneExiste(table, colonne) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, colonne]
  )
  return rows[0]?.n > 0
}

async function ajouterColonneSiAbsente(table, colonne, definitionSql) {
  const existe = await colonneExiste(table, colonne)
  if (existe) return
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definitionSql}`)
  console.log(`[schema] Colonne ajoutée : ${table}.${colonne}`)
}

export async function ensureNotificationSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`notification\` (
        \`id_notification\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_utilisateur\` int(11) NOT NULL,
        \`type_utilisateur\` enum('admin','responsable','collaborateur') NOT NULL,
        \`type\` varchar(40) NOT NULL,
        \`titre\` varchar(150) NOT NULL,
        \`message\` varchar(255) DEFAULT NULL,
        \`lien_page\` varchar(60) DEFAULT NULL,
        \`lu\` tinyint(1) NOT NULL DEFAULT '0',
        \`date_creation\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_notification\`),
        KEY \`destinataire\` (\`id_utilisateur\`, \`type_utilisateur\`, \`lu\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await ajouterColonneSiAbsente(
      'tache', 'rappel_echeance_envoye',
      "`rappel_echeance_envoye` tinyint(1) NOT NULL DEFAULT '0'"
    )

    // Utilisées par "Mon profil" (préférences de compte côté collaborateur) —
    // ajoutées ici aussi par sécurité si la base n'a pas été mise à jour depuis.
    await ajouterColonneSiAbsente(
      'collaborateur', 'notifications_email',
      "`notifications_email` tinyint(1) NOT NULL DEFAULT '1'"
    )
    await ajouterColonneSiAbsente(
      'collaborateur', 'profil_visible',
      "`profil_visible` tinyint(1) NOT NULL DEFAULT '1'"
    )

    // Mêmes colonnes côté responsable, pour sa propre page "Mon profil".
    await ajouterColonneSiAbsente(
      'responsable', 'notifications_email',
      "`notifications_email` tinyint(1) NOT NULL DEFAULT '1'"
    )
    await ajouterColonneSiAbsente(
      'responsable', 'profil_visible',
      "`profil_visible` tinyint(1) NOT NULL DEFAULT '1'"
    )

    console.log('[schema] Notifications : schéma vérifié ✓')
  } catch (err) {
    console.error('[schema] Erreur lors de la vérification du schéma de notifications :', err)
  }
}