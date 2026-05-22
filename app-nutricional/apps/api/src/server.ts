import Fastify from 'fastify'
import { foodsPlugin } from './routes/foods.routes'
import { FoodRepository } from './repositories/food.repository'
import { FoodService } from './services/food.service'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const foodRepository = new FoodRepository()
const foodService = new FoodService(foodRepository)
fastify.register(foodsPlugin, { foodService })

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
    await fastify.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
