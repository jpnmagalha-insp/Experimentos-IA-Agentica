import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authService } from '../services/auth.service'
import { authenticate } from '../middlewares/authenticate'

const registerBody = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
})

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const googleBody = z.object({ idToken: z.string().min(1) })

const appleBody = z.object({
  identityToken: z.string().min(1),
  authorizationCode: z.string().min(1),
  fullName: z
    .object({
      givenName: z.string().nullable().optional(),
      familyName: z.string().nullable().optional(),
    })
    .optional(),
})

const refreshBody = z.object({ refreshToken: z.string().min(1) })

const forgotPasswordBody = z.object({ email: z.string().email() })

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', async (req, reply) => {
    const body = registerBody.parse(req.body)
    const result = await authService.register(body)
    return reply.status(201).send(result)
  })

  fastify.post('/auth/login', async (req, reply) => {
    const body = loginBody.parse(req.body)
    const result = await authService.login(body)
    return reply.status(200).send(result)
  })

  fastify.post('/auth/google', async (req, reply) => {
    const { idToken } = googleBody.parse(req.body)
    const result = await authService.loginWithGoogle(idToken)
    return reply.status(200).send(result)
  })

  fastify.post('/auth/apple', async (req, reply) => {
    const body = appleBody.parse(req.body)
    const result = await authService.loginWithApple(body)
    return reply.status(200).send(result)
  })

  fastify.post('/auth/refresh', async (req, reply) => {
    const { refreshToken } = refreshBody.parse(req.body)
    const result = await authService.refresh(refreshToken)
    return reply.status(200).send(result)
  })

  fastify.post('/auth/forgot-password', async (req, reply) => {
    const { email } = forgotPasswordBody.parse(req.body)
    const result = await authService.forgotPassword(email)
    return reply.status(200).send(result)
  })

  fastify.get('/auth/me', { preHandler: authenticate }, async (req, reply) => {
    const { userService } = await import('../services/user.service')
    const user = await userService.getMe(req.user.id)
    return reply.status(200).send(user)
  })
}
