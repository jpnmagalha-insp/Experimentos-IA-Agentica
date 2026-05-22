import { FastifyReply, FastifyRequest } from 'fastify'
import { verifyAccessToken } from '../lib/jwt'

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string }
  }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return reply.status(401).send({ error: 'Token ausente' })
  }
  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub }
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}
