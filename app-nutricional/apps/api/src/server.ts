import Fastify from 'fastify'
import { errorHandler } from './middlewares/error-handler'
import { authRoutes } from './routes/auth.routes'
import { usersRoutes } from './routes/users.routes'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const start = async () => {
  try {
    await fastify.register(errorHandler)
    await fastify.register(authRoutes, { prefix: '/v1' })
    await fastify.register(usersRoutes, { prefix: '/v1' })

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
    await fastify.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
