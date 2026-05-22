import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../lib/errors'

export async function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: Error, _req: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.flatten().fieldErrors })
    }
    if (error instanceof ConflictError) {
      return reply.status(409).send({ error: error.message })
    }
    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ error: error.message })
    }
    if (error instanceof ForbiddenError) {
      return reply.status(403).send({ error: error.message })
    }
    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: error.message })
    }
    fastify.log.error(error)
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  })
}
