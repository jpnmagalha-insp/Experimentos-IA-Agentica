import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { sendPasswordResetEmail } from '../lib/email'
import { userRepository } from '../repositories/user.repository'
import { ConflictError, UnauthorizedError } from '../lib/errors'

const SALT_ROUNDS = 10

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

async function issueTokenPair(userId: string) {
  const accessToken = signAccessToken(userId)
  const refreshToken = signRefreshToken(userId)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
  })

  return { accessToken, refreshToken }
}

function sanitizeUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email }
}

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const existing = await userRepository.findByEmail(data.email)
    if (existing) throw new ConflictError('E-mail já cadastrado')

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)
    const user = await userRepository.create({ name: data.name, email: data.email, passwordHash })
    const tokens = await issueTokenPair(user.id)
    return { ...tokens, user: sanitizeUser(user) }
  },

  async login(data: { email: string; password: string }) {
    const user = await userRepository.findByEmail(data.email)
    if (!user || !user.passwordHash) throw new UnauthorizedError('Credenciais inválidas')

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Credenciais inválidas')

    const tokens = await issueTokenPair(user.id)
    return { ...tokens, user: sanitizeUser(user) }
  },

  async loginWithGoogle(idToken: string) {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    if (!res.ok) throw new UnauthorizedError('Token Google inválido')

    const gUser = (await res.json()) as {
      sub: string
      email: string
      name: string
      email_verified?: string
    }
    if (!gUser.sub || !gUser.email) throw new UnauthorizedError('Token Google inválido')

    let user = await userRepository.findByEmail(gUser.email)
    const isNewUser = !user

    if (!user) {
      user = await userRepository.create({
        name: gUser.name ?? gUser.email.split('@')[0],
        email: gUser.email,
        provider: 'google',
        providerId: gUser.sub,
        emailVerified: gUser.email_verified === 'true',
      })
    }

    const tokens = await issueTokenPair(user.id)
    return { ...tokens, user: sanitizeUser(user), isNewUser }
  },

  async loginWithApple(data: {
    identityToken: string
    authorizationCode: string
    fullName?: { givenName?: string | null; familyName?: string | null }
  }) {
    const parts = data.identityToken.split('.')
    if (parts.length !== 3) throw new UnauthorizedError('Token Apple inválido')

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as {
      sub: string
      email?: string
      iss: string
    }
    if (payload.iss !== 'https://appleid.apple.com' || !payload.sub) {
      throw new UnauthorizedError('Token Apple inválido')
    }

    let user = await userRepository.findByProvider('apple', payload.sub)
    const isNewUser = !user

    if (!user) {
      const given = data.fullName?.givenName ?? ''
      const family = data.fullName?.familyName ?? ''
      const name = `${given} ${family}`.trim() || 'Usuário Apple'
      const email = payload.email ?? `${payload.sub}@privaterelay.appleid.com`

      user = await userRepository.create({
        name,
        email,
        provider: 'apple',
        providerId: payload.sub,
        emailVerified: true,
      })
    }

    const tokens = await issueTokenPair(user.id)
    return { ...tokens, user: sanitizeUser(user), isNewUser }
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string }
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new UnauthorizedError('Refresh token inválido ou expirado')
    }

    const tokenHash = hashToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token inválido ou expirado')
    }

    await prisma.refreshToken.delete({ where: { tokenHash } })
    return issueTokenPair(payload.sub)
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email)
    if (user) {
      const resetToken = randomBytes(32).toString('hex')
      await sendPasswordResetEmail(email, resetToken)
    }
    return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções.' }
  },
}
