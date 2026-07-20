// Règle de robustesse du mot de passe (miroir exact de backend/utils/passwordRules.js) :
// 8 caractères minimum, au moins 1 majuscule, 1 minuscule, 1 chiffre et 1 symbole.
export const PASSWORD_RULES_MESSAGE =
  'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.'

export function getPasswordChecklist(password = '') {
  return [
    { key: 'length', label: 'Au moins 8 caractères', ok: password.length >= 8 },
    { key: 'lower', label: 'Une minuscule', ok: /[a-z]/.test(password) },
    { key: 'upper', label: 'Une majuscule', ok: /[A-Z]/.test(password) },
    { key: 'digit', label: 'Un chiffre', ok: /[0-9]/.test(password) },
    { key: 'symbol', label: 'Un symbole (ex. ! @ # ?)', ok: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function isPasswordStrong(password) {
  return getPasswordChecklist(password).every((rule) => rule.ok)
}