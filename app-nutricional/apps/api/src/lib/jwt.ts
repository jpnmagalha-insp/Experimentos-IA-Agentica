import { createHmac, timingSafeEqual } from 'node:crypto'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

function b64url(data: string): string {
  return Buffer.from(data).toString('base64url')
}

function signJwt(payload: Record<string, unknown>, secret: string, expiresInSec: number): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }))
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function verifyJwt(token: string, secret: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')
  const [header, body, sig] = parts

  const expectedSig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  const sigBuf = Buffer.from(sig, 'base64url')
  const expectedBuf = Buffer.from(expectedSig, 'base64url')
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid signature')
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }
  return payload
}

export function signAccessToken(userId: string): string {
  return signJwt({ sub: userId }, ACCESS_SECRET, 15 * 60)
}

export function signRefreshToken(userId: string): string {
  return signJwt({ sub: userId }, REFRESH_SECRET, 30 * 24 * 60 * 60)
}

export function verifyAccessToken(token: string): { sub: string } {
  const payload = verifyJwt(token, ACCESS_SECRET)
  if (typeof payload.sub !== 'string') throw new Error('Invalid payload')
  return { sub: payload.sub }
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = verifyJwt(token, REFRESH_SECRET)
  if (typeof payload.sub !== 'string') throw new Error('Invalid payload')
  return { sub: payload.sub }
}
