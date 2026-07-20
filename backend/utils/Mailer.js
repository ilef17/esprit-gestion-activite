import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

let transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  }
  return transporter
}

// Couleurs alignées sur la charte de l'app (voir auth.css :root)
const COLORS = {
  red: '#E4032E',
  redDark: '#B30224',
  redTint: '#FCE1E5',
  bg: '#F6F7FA',
  card: '#FFFFFF',
  text: '#1D1D2B',
  textMuted: '#767A8A',
  textFaint: '#A6A9B4',
  border: '#E7E8EF',
}

function buildResetHtml({ identifiant, code }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Réinitialisation de mot de passe</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:${COLORS.card}; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(20,20,40,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${COLORS.red}; padding:26px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:34px; height:34px; background:rgba(255,255,255,0.18); border-radius:9px; text-align:center; vertical-align:middle;">
                    <span style="color:#ffffff; font-size:18px;">&#8962;</span>
                  </td>
                  <td style="padding-left:10px; vertical-align:middle;">
                    <div style="color:#ffffff; font-weight:800; font-size:17px; line-height:1.1;">esprit</div>
                    <div style="color:rgba(255,255,255,0.85); font-size:9.5px; letter-spacing:1px; font-weight:700; text-transform:uppercase;">Gestion des Activités</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 14px; font-size:18px; color:${COLORS.text};">Réinitialisation de votre mot de passe</h1>
              <p style="margin:0 0 6px; font-size:13.5px; color:${COLORS.textMuted}; line-height:1.6;">
                Bonjour${identifiant ? ` <strong style="color:${COLORS.text};">${identifiant}</strong>` : ''},
              </p>
              <p style="margin:0 0 24px; font-size:13.5px; color:${COLORS.textMuted}; line-height:1.6;">
                Une demande de réinitialisation de mot de passe a été effectuée pour votre compte ESPRIT&nbsp;·&nbsp;Gestion des Activités. Utilisez le code ci-dessous pour continuer&nbsp;:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="background:${COLORS.redTint}; border-radius:12px; padding:20px;">
                    <span style="font-size:32px; font-weight:800; letter-spacing:10px; color:${COLORS.redDark}; font-family:'Courier New', monospace;">${code}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px; font-size:12.5px; color:${COLORS.textMuted}; line-height:1.6;">
                Ce code est valable <strong style="color:${COLORS.text};">10 minutes</strong> et ne peut être utilisé qu'une seule fois.
              </p>
              <p style="margin:0; font-size:12.5px; color:${COLORS.textFaint}; line-height:1.6;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail — votre mot de passe restera inchangé.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px; border-top:1px solid ${COLORS.border};">
              <p style="margin:0; font-size:11px; color:${COLORS.textFaint}; text-align:center;">
                Ceci est un e-mail automatique, merci de ne pas y répondre.<br />
                — L'équipe ESPRIT · Gestion des Activités
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function buildResetText({ identifiant, code }) {
  return (
    `Bonjour ${identifiant || ''},\n\n` +
    `Une demande de réinitialisation de mot de passe a été effectuée pour votre compte ESPRIT · Gestion des Activités.\n\n` +
    `Voici votre code de vérification : ${code}\n\n` +
    `Ce code est valable 10 minutes et ne peut être utilisé qu'une seule fois.\n\n` +
    `Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail — votre mot de passe restera inchangé.\n\n` +
    `— L'équipe ESPRIT · Gestion des Activités`
  )
}

function formatDateFr(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildDemandeHtml({ collaborateurNom, description, contexte, dateDebut, dateFin, confirmUrl }) {
  const periode = dateDebut || dateFin
    ? `${formatDateFr(dateDebut) || '—'} → ${formatDateFr(dateFin) || '—'}`
    : null

  const rows = [
    ['Description', description],
    contexte ? ['Contexte', contexte] : null,
    periode ? ['Période', periode] : null,
  ].filter(Boolean)

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0; border-top:1px solid ${COLORS.border}; font-size:12px; color:${COLORS.textFaint}; width:110px; vertical-align:top;">${label}</td>
      <td style="padding:10px 0; border-top:1px solid ${COLORS.border}; font-size:13px; color:${COLORS.text}; vertical-align:top;">${value}</td>
    </tr>`).join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Vérification d'une activité hors équipe</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px; width:100%; background:${COLORS.card}; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(20,20,40,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${COLORS.red}; padding:26px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:34px; height:34px; background:rgba(255,255,255,0.18); border-radius:9px; text-align:center; vertical-align:middle;">
                    <span style="color:#ffffff; font-size:18px;">&#8962;</span>
                  </td>
                  <td style="padding-left:10px; vertical-align:middle;">
                    <div style="color:#ffffff; font-weight:800; font-size:17px; line-height:1.1;">esprit</div>
                    <div style="color:rgba(255,255,255,0.85); font-size:9.5px; letter-spacing:1px; font-weight:700; text-transform:uppercase;">Gestion des Activités</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 14px; font-size:18px; color:${COLORS.text};">Demande de vérification d'activité</h1>
              <p style="margin:0 0 22px; font-size:13.5px; color:${COLORS.textMuted}; line-height:1.6;">
                <strong style="color:${COLORS.text};">${collaborateurNom}</strong> a déclaré une activité réalisée hors de son équipe sur ESPRIT&nbsp;·&nbsp;Gestion des Activités, et vous a identifié comme contact pour la confirmer.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
                ${rowsHtml}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" style="display:inline-block; background:${COLORS.red}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:13px 28px; border-radius:10px;">
                      Confirmer cette activité
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:12px; color:${COLORS.textFaint}; line-height:1.6;">
                En cliquant sur ce lien, vous confirmez que cette activité a bien eu lieu telle que décrite ci-dessus. Elle sera alors automatiquement validée et intégrée au dossier du collaborateur. Si cette demande ne vous concerne pas, vous pouvez ignorer cet e-mail.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px; border-top:1px solid ${COLORS.border};">
              <p style="margin:0; font-size:11px; color:${COLORS.textFaint}; text-align:center;">
                Ceci est un e-mail automatique, merci de ne pas y répondre directement.<br />
                — L'équipe ESPRIT · Gestion des Activités
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function buildDemandeText({ collaborateurNom, description, contexte, dateDebut, dateFin, confirmUrl }) {
  const periode = dateDebut || dateFin
    ? `${formatDateFr(dateDebut) || '—'} → ${formatDateFr(dateFin) || '—'}`
    : null

  return (
    `${collaborateurNom} a déclaré une activité réalisée hors de son équipe sur ESPRIT · Gestion des Activités, et vous a identifié comme contact pour la confirmer.\n\n` +
    `Description : ${description}\n` +
    (contexte ? `Contexte : ${contexte}\n` : '') +
    (periode ? `Période : ${periode}\n` : '') +
    `\nPour confirmer cette activité, ouvrez ce lien :\n${confirmUrl}\n\n` +
    `En confirmant, l'activité sera automatiquement validée et intégrée au dossier du collaborateur. Si cette demande ne vous concerne pas, ignorez cet e-mail.\n\n` +
    `— L'équipe ESPRIT · Gestion des Activités`
  )
}

// Envoie l'email de vérification d'une activité hors équipe au contact désigné par le
// Super Admin, avec un lien de confirmation en un clic (voir demandes.controller.js).
export async function sendDemandeVerificationEmail({ to, collaborateurNom, description, contexte, dateDebut, dateFin, confirmUrl }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP non configuré — lien de confirmation pour ${to} : ${confirmUrl}`)
    return
  }

  const from = process.env.SMTP_FROM || '"ESPRIT · Gestion des Activités" <no-reply@esprit.local>'
  const payload = { collaborateurNom, description, contexte, dateDebut, dateFin, confirmUrl }

  await getTransporter().sendMail({
    from,
    to,
    subject: `Vérification requise — activité hors équipe de ${collaborateurNom}`,
    text: buildDemandeText(payload),
    html: buildDemandeHtml(payload),
  })
}

function buildDemandeStatutHtml({ collaborateurNom, description, statut }) {
  const accepted = statut === 'validee'
  const color = accepted ? '#1FAE63' : COLORS.redDark
  const bg = accepted ? '#E7F8EF' : COLORS.redTint
  const title = accepted ? 'Votre demande a été validée' : 'Votre demande a été refusée'
  const message = accepted
    ? "Bonne nouvelle : votre activité hors équipe a été vérifiée et validée. Elle est désormais intégrée à votre dossier."
    : "Votre activité hors équipe n'a pas pu être validée. Vous pouvez contacter le Super Admin pour plus de détails."

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:${COLORS.card}; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(20,20,40,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${COLORS.red}; padding:26px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:34px; height:34px; background:rgba(255,255,255,0.18); border-radius:9px; text-align:center; vertical-align:middle;">
                    <span style="color:#ffffff; font-size:18px;">&#8962;</span>
                  </td>
                  <td style="padding-left:10px; vertical-align:middle;">
                    <div style="color:#ffffff; font-weight:800; font-size:17px; line-height:1.1;">esprit</div>
                    <div style="color:rgba(255,255,255,0.85); font-size:9.5px; letter-spacing:1px; font-weight:700; text-transform:uppercase;">Gestion des Activités</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="width:40px; height:40px; border-radius:50%; background:${bg}; color:${color}; text-align:center; vertical-align:middle; font-size:20px; font-weight:800;">
                    ${accepted ? '&#10003;' : '!'}
                  </td>
                  <td style="padding-left:12px; vertical-align:middle;">
                    <h1 style="margin:0; font-size:17px; color:${COLORS.text};">${title}</h1>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px; font-size:13.5px; color:${COLORS.textMuted}; line-height:1.6;">
                Bonjour <strong style="color:${COLORS.text};">${collaborateurNom}</strong>,
              </p>
              <p style="margin:0 0 22px; font-size:13.5px; color:${COLORS.textMuted}; line-height:1.6;">
                ${message}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                <tr>
                  <td style="padding:10px 14px; background:${COLORS.bg}; border-radius:10px; font-size:12.5px; color:${COLORS.text};">
                    ${description}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px; border-top:1px solid ${COLORS.border};">
              <p style="margin:0; font-size:11px; color:${COLORS.textFaint}; text-align:center;">
                Ceci est un e-mail automatique, merci de ne pas y répondre.<br />
                — L'équipe ESPRIT · Gestion des Activités
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function buildDemandeStatutText({ collaborateurNom, description, statut }) {
  const accepted = statut === 'validee'
  return (
    `Bonjour ${collaborateurNom},\n\n` +
    (accepted
      ? "Bonne nouvelle : votre activité hors équipe a été vérifiée et validée. Elle est désormais intégrée à votre dossier.\n\n"
      : "Votre activité hors équipe n'a pas pu être validée. Vous pouvez contacter le Super Admin pour plus de détails.\n\n") +
    `Description : ${description}\n\n` +
    `— L'équipe ESPRIT · Gestion des Activités`
  )
}

// Notifie le collaborateur par email quand sa demande d'activité hors équipe est
// validée ou refusée (par le Super Admin, ou automatiquement via le lien de
// confirmation quand "Validation automatique" est activé dans Paramètres).
export async function sendDemandeStatutEmail({ to, collaborateurNom, description, statut }) {
  if (!to) return
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP non configuré — notification "${statut}" non envoyée à ${to}`)
    return
  }

  const from = process.env.SMTP_FROM || '"ESPRIT · Gestion des Activités" <no-reply@esprit.local>'
  const payload = { collaborateurNom, description, statut }

  await getTransporter().sendMail({
    from,
    to,
    subject: statut === 'validee' ? 'Votre activité hors équipe a été validée' : 'Votre activité hors équipe a été refusée',
    text: buildDemandeStatutText(payload),
    html: buildDemandeStatutHtml(payload),
  })
}

const TYPE_AFFECTATION_LABELS = {
  normal: 'Cours normal',
  alternance: 'Alternance',
  international: 'Classe internationale',
  autre: 'Autre',
}

function buildAffectationHtml({ collaborateurNom, module, type, niveau, classes }) {
  const rows = [
    ['Module', module],
    type && TYPE_AFFECTATION_LABELS[type] ? ['Type', TYPE_AFFECTATION_LABELS[type]] : null,
    niveau ? ['Niveau', niveau] : null,
    classes && classes.length ? ['Classe(s)', classes.join(', ')] : null,
  ].filter(Boolean)

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0; border-top:1px solid ${COLORS.border}; font-size:12px; color:${COLORS.textFaint}; width:110px; vertical-align:top;">${label}</td>
      <td style="padding:10px 0; border-top:1px solid ${COLORS.border}; font-size:13px; color:${COLORS.text}; vertical-align:top;">${value}</td>
    </tr>`).join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Votre affectation pédagogique</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:${COLORS.card}; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(20,20,40,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${COLORS.red}; padding:26px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:34px; height:34px; background:rgba(255,255,255,0.18); border-radius:9px; text-align:center; vertical-align:middle;">
                    <span style="color:#ffffff; font-size:18px;">&#8962;</span>
                  </td>
                  <td style="padding-left:10px; vertical-align:middle;">
                    <div style="color:#ffffff; font-weight:800; font-size:17px; line-height:1.1;">esprit</div>
                    <div style="color:rgba(255,255,255,0.85); font-size:9.5px; letter-spacing:1px; font-weight:700; text-transform:uppercase;">Gestion des Activités</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 14px; font-size:18px; color:${COLORS.text};">Votre affectation pédagogique</h1>
              <p style="margin:0 0 22px; font-size:13.5px; color:${COLORS.textMuted}; line-height:1.6;">
                Bonjour <strong style="color:${COLORS.text};">${collaborateurNom}</strong>, suite à votre réponse au questionnaire de vœux pédagogiques, vous avez été affecté(e) comme suit&nbsp;:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
                ${rowsHtml}
              </table>

              <p style="margin:0; font-size:12px; color:${COLORS.textFaint}; line-height:1.6;">
                Vous pouvez retrouver le détail de cette affectation à tout moment dans votre espace collaborateur.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px; border-top:1px solid ${COLORS.border};">
              <p style="margin:0; font-size:11px; color:${COLORS.textFaint}; text-align:center;">
                Ceci est un e-mail automatique, merci de ne pas y répondre.<br />
                — L'équipe ESPRIT · Gestion des Activités
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function buildAffectationText({ collaborateurNom, module, type, niveau, classes }) {
  return (
    `Bonjour ${collaborateurNom},\n\n` +
    `Suite à votre réponse au questionnaire de vœux pédagogiques, vous avez été affecté(e) comme suit :\n\n` +
    `Module : ${module}\n` +
    (type && TYPE_AFFECTATION_LABELS[type] ? `Type : ${TYPE_AFFECTATION_LABELS[type]}\n` : '') +
    (niveau ? `Niveau : ${niveau}\n` : '') +
    (classes && classes.length ? `Classe(s) : ${classes.join(', ')}\n` : '') +
    `\nVous pouvez retrouver le détail de cette affectation dans votre espace collaborateur.\n\n` +
    `— L'équipe ESPRIT · Gestion des Activités`
  )
}

// Notifie le collaborateur par email quand l'admin l'affecte à un module suite à sa
// réponse au questionnaire de vœux pédagogiques (voir voeuxPedagogiques.controller.js).
export async function sendAffectationEmail({ to, collaborateurNom, module, type, niveau, classes }) {
  if (!to) return
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP non configuré — affectation "${module}" non notifiée à ${to}`)
    return
  }

  const from = process.env.SMTP_FROM || '"ESPRIT · Gestion des Activités" <no-reply@esprit.local>'
  const payload = { collaborateurNom, module, type, niveau, classes }

  await getTransporter().sendMail({
    from,
    to,
    subject: `Votre affectation pédagogique — ${module}`,
    text: buildAffectationText(payload),
    html: buildAffectationHtml(payload),
  })
}

function formatDateEcheanceFr(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildTacheEcheanceHtml({ collaborateurNom, titre, dateEcheance }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Rappel d'échéance</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:${COLORS.card}; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(20,20,40,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${COLORS.red}; padding:26px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:34px; height:34px; background:rgba(255,255,255,0.18); border-radius:9px; text-align:center; vertical-align:middle;">
                    <span style="color:#ffffff; font-size:18px;">&#8962;</span>
                  </td>
                  <td style="padding-left:10px; vertical-align:middle;">
                    <div style="color:#ffffff; font-weight:800; font-size:17px; line-height:1.1;">esprit</div>
                    <div style="color:rgba(255,255,255,0.85); font-size:9.5px; letter-spacing:1px; font-weight:700; text-transform:uppercase;">Gestion des Activités</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 14px; font-size:18px; color:${COLORS.text};">Rappel : échéance dans 2 jours</h1>
              <p style="margin:0 0 22px; font-size:13.5px; color:${COLORS.textMuted}; line-height:1.6;">
                Bonjour <strong style="color:${COLORS.text};">${collaborateurNom}</strong>, la tâche suivante arrive à échéance dans 2 jours&nbsp;:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
                <tr>
                  <td style="padding:14px; background:${COLORS.redTint}; border-radius:10px;">
                    <div style="font-size:14px; font-weight:700; color:${COLORS.text}; margin-bottom:4px;">${titre}</div>
                    <div style="font-size:12.5px; color:${COLORS.textMuted};">Échéance : ${formatDateEcheanceFr(dateEcheance)}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:12px; color:${COLORS.textFaint}; line-height:1.6;">
                Vous pouvez mettre à jour son statut à tout moment depuis votre espace collaborateur.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px; border-top:1px solid ${COLORS.border};">
              <p style="margin:0; font-size:11px; color:${COLORS.textFaint}; text-align:center;">
                Ceci est un e-mail automatique, merci de ne pas y répondre.<br />
                — L'équipe ESPRIT · Gestion des Activités
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function buildTacheEcheanceText({ collaborateurNom, titre, dateEcheance }) {
  return (
    `Bonjour ${collaborateurNom},\n\n` +
    `La tâche "${titre}" arrive à échéance dans 2 jours (${formatDateEcheanceFr(dateEcheance)}).\n\n` +
    `Vous pouvez mettre à jour son statut depuis votre espace collaborateur.\n\n` +
    `— L'équipe ESPRIT · Gestion des Activités`
  )
}

// Rappel J-2 avant l'échéance d'une tâche non validée (voir cron dans server.js).
// Respecte la préférence "notifications_email" du collaborateur (page Mon profil) :
// l'appelant ne doit invoquer cette fonction que si elle est activée.
export async function sendTacheEcheanceEmail({ to, collaborateurNom, titre, dateEcheance }) {
  if (!to) return
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP non configuré — rappel d'échéance "${titre}" non envoyé à ${to}`)
    return
  }

  const from = process.env.SMTP_FROM || '"ESPRIT · Gestion des Activités" <no-reply@esprit.local>'
  const payload = { collaborateurNom, titre, dateEcheance }

  await getTransporter().sendMail({
    from,
    to,
    subject: `Rappel — échéance dans 2 jours : ${titre}`,
    text: buildTacheEcheanceText(payload),
    html: buildTacheEcheanceHtml(payload),
  })
}

// Envoie le code de vérification à 6 chiffres pour la réinitialisation de mot de passe.
// En dev, si aucun SMTP n'est configuré, on log simplement le code dans la console
// pour ne pas bloquer le flux de test.
export async function sendResetCodeEmail({ to, identifiant, code }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP non configuré — code de réinitialisation pour ${to} : ${code}`)
    return
  }

  const from = process.env.SMTP_FROM || '"ESPRIT · Gestion des Activités" <no-reply@esprit.local>'

  await getTransporter().sendMail({
    from,
    to,
    subject: 'Votre code de réinitialisation de mot de passe',
    text: buildResetText({ identifiant, code }),
    html: buildResetHtml({ identifiant, code }),
  })
}