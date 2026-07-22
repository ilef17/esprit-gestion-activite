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

    // Côté admin, seule "Notifications par email" existe dans "Mon profil" (pas de
    // toggle de visibilité, l'admin voit tout par définition).
    await ajouterColonneSiAbsente(
      'admin', 'notifications_email',
      "`notifications_email` tinyint(1) NOT NULL DEFAULT '1'"
    )

    // "Activité Au Sein ESPRIT" était jusqu'ici un critère personnalisé (code NULL) noté
    // manuellement par l'admin dans la grille "Noter les membres" — ce qui ouvrait la
    // porte à du favoritisme (un ami noté plus haut qu'un collègue équivalent, sans
    // justification vérifiable). On le rattache à un calcul automatique (encadrements +
    // expertises + activités académiques, voir getActiviteEcoleRatios dans
    // evaluationScore.model.js) en lui donnant le code `activite_ecole`, exactement comme
    // les 4 critères de base : dès qu'un critère a un code, l'UI admin masque la grille de
    // notation manuelle (elle ne s'affiche que pour `!c.code`) et la note est recalculée à
    // partir des données réelles à chaque application de la formule.
    // Si l'admin l'avait déjà créé à la main (nom identique), on lui ajoute juste le code
    // en conservant sa pondération existante ; sinon on le crée avec pondération 0 (à
    // ajuster ensuite via le curseur, comme n'importe quel critère).
    const [dejaConnecte] = await pool.query(
      "SELECT id_critere FROM critere_evaluation WHERE code = 'activite_ecole' LIMIT 1"
    )
    if (dejaConnecte.length === 0) {
      const [dejaPersonnalise] = await pool.query(
        "SELECT id_critere FROM critere_evaluation WHERE nom = 'Activité Au Sein ESPRIT' AND code IS NULL LIMIT 1"
      )
      if (dejaPersonnalise.length > 0) {
        await pool.query(
          "UPDATE critere_evaluation SET code = 'activite_ecole' WHERE id_critere = ?",
          [dejaPersonnalise[0].id_critere]
        )
        console.log('[schema] Critère "Activité Au Sein ESPRIT" rattaché au calcul automatique')
      } else {
        await pool.query(
          "INSERT INTO critere_evaluation (nom, code, ponderation) VALUES ('Activité Au Sein ESPRIT', 'activite_ecole', 0)"
        )
        console.log('[schema] Critère "Activité Au Sein ESPRIT" créé (calcul automatique)')
      }
    }

    console.log('[schema] Notifications : schéma vérifié ✓')
  } catch (err) {
    console.error('[schema] Erreur lors de la vérification du schéma de notifications :', err)
  }
}