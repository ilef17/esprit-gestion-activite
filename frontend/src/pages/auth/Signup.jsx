import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getSousEquipes } from '../../services/api.js'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
import EspritLogo from '../../components/EspritLogo.jsx'
import './auth.css'
import ReCAPTCHA from 'react-google-recaptcha'

function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [identifiant, setIdentifiant] = useState('')
  const [role, setRole] = useState('collaborateur') // 'collaborateur' | 'responsable'
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const [sousEquipes, setSousEquipes] = useState([])
  const [selectedSousEquipes, setSelectedSousEquipes] = useState([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSousEquipes()
      .then(setSousEquipes)
      .catch(() => setSousEquipes([]))
  }, [])

  function toggleSousEquipe(id) {
    setSelectedSousEquipes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!prenom || !nom || !email || !identifiant || !password) {
      setError('Merci de remplir tous les champs obligatoires.')
      return
    }
    if (!isPasswordStrong(password)) {
      setError(PASSWORD_RULES_MESSAGE)
      return
    }
    if (!captchaToken) {
  setError('Merci de confirmer que vous n\'êtes pas un robot.')
  return
}

    setLoading(true)
    try {
      await signup({
        role,
        prenom,
        nom,
        email,
        identifiant_esprit: identifiant,
        password,
        sousEquipeIds: role === 'collaborateur' ? selectedSousEquipes : [],
        captchaToken,
      })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="login-shell signup-shell">
        <div className="login-left">
          <EspritLogo full className="login-logo" />

          <h1 className="login-title">
            Créez votre <span>compte</span>.
          </h1>

          <div className="login-illustration">
            <svg fill="none" viewBox="0 0 380 260" xmlns="http://www.w3.org/2000/svg">
              <rect fill="#fff" height="196" rx="16" stroke="#ECEDF2" strokeWidth="2" width="288" x="46" y="34"></rect>
              <path d="M46 50a16 16 0 0 1 16-16h256a16 16 0 0 1 16 16v18H46V50Z" fill="#F6F7FA"></path>
              <circle cx="66" cy="51" fill="var(--red)" r="4"></circle>
              <circle cx="80" cy="51" fill="#FBBF24" r="4"></circle>
              <circle cx="94" cy="51" fill="var(--green)" r="4"></circle>
              <circle cx="130" cy="122" fill="var(--red-light)" r="34"></circle>
              <circle cx="130" cy="112" fill="var(--red)" r="13"></circle>
              <path d="M104 148c4-16 15-24 26-24s22 8 26 24" fill="var(--red)"></path>
              <rect fill="#E7E8EF" height="9" rx="4.5" width="110" x="186" y="92"></rect>
              <rect fill="#E7E8EF" height="9" rx="4.5" width="80" x="186" y="110"></rect>
              <rect fill="#E7E8EF" height="9" rx="4.5" width="96" x="186" y="128"></rect>
              <rect fill="#F6F7FA" height="30" rx="8" stroke="#ECEDF2" strokeWidth="1.5" width="240" x="70" y="180"></rect>
              <rect fill="var(--red-light)" height="8" rx="4" width="70" x="82" y="191"></rect>
              <rect fill="#fff" height="8" rx="4" stroke="#ECEDF2" strokeWidth="1" width="70" x="160" y="191"></rect>
              <rect fill="#fff" height="8" rx="4" stroke="#ECEDF2" strokeWidth="1" width="52" x="238" y="191"></rect>
              <g transform="translate(288,178)">
                <circle cx="24" cy="24" fill="var(--red)" r="24"></circle>
                <path d="M24 15v18M15 24h18" stroke="#fff" strokeLinecap="round" strokeWidth="3.2"></path>
              </g>
            </svg>
          </div>
        </div>

        <div className="login-right">
          <form className="login-card signup-card" onSubmit={handleSubmit}>
            <p className="login-hint">Créez votre compte pour accéder à votre espace de gestion des activités.</p>

            {error && <div className="form-error">{error}</div>}

            <div className="form-grid" style={{ marginBottom: '4px' }}>
              <div className="field">
                <label>Prénom</label>
                <input placeholder="Hana" type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
              </div>
              <div className="field">
                <label>Nom</label>
                <input placeholder="Belaid" type="text" value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div className="field full">
                <label>Email institutionnel</label>
                <input placeholder="prenom.nom@esprit.tn" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field full">
                <label>Identifiant ESPRIT</label>
                <input placeholder="Ex. 253JFT5450" type="text" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} />
              </div>

              <div className="field full">
                <label>Rôle souhaité</label>
                <select id="signup-role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="collaborateur">Collaborateur</option>
                  <option value="responsable">Responsable de sous-équipe</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="field-note">
                  {role === 'admin'
                    ? "Réservé à un administrateur déjà connecté — la création échouera sinon."
                    : "Le compte Admin est créé uniquement par l'administration."}
                </div>
              </div>

              {role === 'collaborateur' && (
                <div className="field full" id="signup-teams-field">
                  <label>Sous-équipe(s) souhaitée(s)</label>
                  <div className="field-note" style={{ marginBottom: '8px' }}>
                    Un collaborateur peut rejoindre plusieurs sous-équipes.
                  </div>
                  {sousEquipes.map((se) => (
                    <div
                      key={se.id_sous_equipe}
                      className={`vow-chip selectable ${selectedSousEquipes.includes(se.id_sous_equipe) ? 'selected' : ''}`}
                      onClick={() => toggleSousEquipe(se.id_sous_equipe)}
                    >
                      <div className="left">{se.nom}</div>
                    </div>
                  ))}
                </div>
              )}

             <div className="field full">
                <label>Mot de passe</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                    ) : (
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {password && (
                  <ul className="password-checklist">
                    {getPasswordChecklist(password).map((rule) => (
                      <li key={rule.key} className={rule.ok ? 'ok' : ''}>
                        <span className="dot">{rule.ok ? '✓' : '•'}</span>{rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

           <ReCAPTCHA
  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
  onChange={(token) => setCaptchaToken(token)}
  onExpired={() => setCaptchaToken(null)}
/>

            <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>

            <p className="login-signup">
              Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Signup
