import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { userService } from '../services/user.service'
import { authenticate } from '../middlewares/authenticate'

const profileBody = z.object({
  birthDate: z.string().date('Data de nascimento inválida'),
  sex: z.enum(['male', 'female']),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(10).max(500),
  bodyFatPercent: z.number().min(1).max(60).optional().nullable(),
})

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/users/me', { preHandler: authenticate }, async (req, reply) => {
    const user = await userService.getMe(req.user.id)
    return reply.status(200).send(user)
  })

  fastify.put('/users/me/profile', { preHandler: authenticate }, async (req, reply) => {
    const body = profileBody.parse(req.body)
    const result = await userService.upsertProfile(req.user.id, body)
    return reply.status(200).send(result)
  })
}
