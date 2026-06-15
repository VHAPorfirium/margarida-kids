const BASE = 'http://127.0.0.1:54321'
const ANON = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const SERVICE = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

// 1. Testa login direto no GoTrue
console.log('=== Testando signIn ===')
const signIn = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'sysadmin@admin.com', password: 'Admin@123' })
})
console.log('Status:', signIn.status)
console.log(JSON.stringify(await signIn.json(), null, 2))

// 2. Testa admin API
console.log('\n=== Testando admin API ===')
const admin = await fetch(`${BASE}/auth/v1/admin/users`, {
  headers: { 'apikey': SERVICE, 'Authorization': `Bearer ${SERVICE}` }
})
console.log('Status admin:', admin.status)
const adminBody = await admin.json()
console.log(JSON.stringify(adminBody).slice(0, 300))
