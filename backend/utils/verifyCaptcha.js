export async function verifyCaptcha(token) {
  if (!token) return false
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  })
  const data = await res.json()
  console.log('reCAPTCHA response:', data)   // add this line
  return data.success
}