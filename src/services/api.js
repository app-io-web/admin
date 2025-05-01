const BASE_URL = import.meta.env.VITE_NOCODB_URL
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN

// 🔍 GET
export async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'accept': 'application/json',
      'xc-token': TOKEN,
    }
  })
  if (!res.ok) throw new Error(`Erro GET: ${res.status}`)
  return await res.json()
}

// ✏️ PATCH
export async function apiPatch(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'xc-token': TOKEN,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Erro PATCH: ${res.status}`)
  return await res.json()
}


// ➕ POST
export async function apiPost(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'xc-token': TOKEN,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Erro POST: ${res.status}`)
  return await res.json()
}
