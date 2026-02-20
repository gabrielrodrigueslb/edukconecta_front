const LOCAL_API_BASE = 'http://localhost:4457/api'

function normalize(value?: string | null) {
  if (!value) return ''
  return value.trim()
}

export function getApiBaseUrl() {
  const explicit = normalize(process.env.NEXT_PUBLIC_API_URL)
  if (explicit) return explicit

  if (process.env.NODE_ENV === 'production') {
    return 'https://api.edukconecta.com/api'
  }

  return LOCAL_API_BASE
}
