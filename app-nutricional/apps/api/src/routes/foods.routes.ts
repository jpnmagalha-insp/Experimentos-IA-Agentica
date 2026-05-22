import type { FastifyPluginAsync } from 'fastify'
import { foodSearchQuerySchema } from '@nutri-ia/shared'
import type { FoodService } from '../services/food.service'

interface FoodsPluginOptions {
  foodService: FoodService
}

export const foodsPlugin: FastifyPluginAsync<FoodsPluginOptions> = async (fastify, opts) => {
  fastify.get('/foods/search', async (request, reply) => {
    const result = foodSearchQuerySchema.safeParse(request.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }
    const foods = await opts.foodService.search(result.data.q, result.data.limit)
    return reply.send({ foods })
  })
}
