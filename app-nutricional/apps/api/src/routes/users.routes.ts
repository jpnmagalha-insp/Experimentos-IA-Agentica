import { FastifyInstance } from 'fastify'
import { updateProfileSchema } from '@nutri-ia/shared'
import { userService } from '../services/user.service'
import { authenticate } from '../middlewares/authenticate'

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/users/me', { preHandler: authenticate }, async (req, reply) => {
    const user = await userService.getMe(req.user.id)
    return reply.status(200).send(user)
  })

  fastify.put('/users/me/profile', { preHandler: authenticate }, async (req, reply) => {
    const body = updateProfileSchema.parse(req.body)
    const result = await userService.upsertProfile(req.user.id, body)
    return reply.status(200).send(result)
  })
}
