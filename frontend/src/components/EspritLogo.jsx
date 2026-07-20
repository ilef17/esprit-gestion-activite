import logoCompact from '../assets/esprit-logo.png'
import logoFull from '../assets/esprit-logo-full.png'
import logoCompactDark from '../assets/esprit-logo-dark.png'
import logoFullDark from '../assets/esprit-logo-full-dark.png'

// Logo ESPRIT officiel, partagé par toute l'application (sidebar admin, topnav
// collaborateur, sidebar responsable, écrans de connexion/inscription). Un seul
// point de vérité : pour remplacer le visuel, il suffit de remplacer les fichiers
// dans src/assets/ — aucune autre modification n'est nécessaire :
//   - esprit-logo.png / esprit-logo-full.png       → version claire (texte noir/rouge)
//   - esprit-logo-dark.png / esprit-logo-full-dark.png → version sombre officielle
//     (texte blanc/gris + flèche rouge, sur fond transparent), utilisée sur fond
//     sombre au lieu de simuler le blanc avec un filtre CSS.
// "full" = version complète avec "Honoris United Universities" (écrans de
// connexion/inscription) ; sinon version compacte "esprit — Se former autrement"
// (barres de navigation).
//
// Le logo est affiché directement, fond transparent, sans carte blanche, pour se
// fondre dans la page (comme sur les écrans ESPRIT-ARP réels). Les deux variantes
// (claire/sombre) sont rendues en même temps ; c'est le CSS qui choisit laquelle
// afficher selon le contexte — voir `.esprit-logo-dark`/`.esprit-logo-light` dans
// admin.css, collaborateur.css et responsable.css (affichée dans `.sidebar-dark`
// et/ou `.dark`).
function EspritLogo({ full = false, className = '' }) {
  return (
    <div className={`logo esprit-logo-card ${className}`.trim()}>
      <img className="esprit-logo-light" src={full ? logoFull : logoCompact} alt="ESPRIT — Se former autrement" />
      <img className="esprit-logo-dark" src={full ? logoFullDark : logoCompactDark} alt="ESPRIT — Se former autrement" />
    </div>
  )
}

export default EspritLogo