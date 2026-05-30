/**
 * Cloudflare Worker — streamed.pk CORS proxy
 *
 * Deploy:
 *  1. Wejdź na https://workers.cloudflare.com → "Create Worker"
 *  2. Wklej całą zawartość tego pliku
 *  3. Kliknij "Deploy"
 *  4. Skopiuj URL workera (np. https://sports-proxy.TWOJ-LOGIN.workers.dev)
 *  5. Wklej go do src/lib/sportsApi.ts jako WORKER_URL
 */

const UPSTREAM = 'https://streamed.pk'
const ALLOWED_ORIGIN = '*' // możesz zawęzić do 'https://baroflix.github.io'

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    const target = `${UPSTREAM}${url.pathname}${url.search}`

    let res
    try {
      res = await fetch(target, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': UPSTREAM + '/',
          'Origin': UPSTREAM,
          'Accept': 'application/json, */*',
        },
        redirect: 'follow',
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      })
    }

    const body = await res.arrayBuffer()

    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Cache-Control': 'public, max-age=20',
      },
    })
  },
}
