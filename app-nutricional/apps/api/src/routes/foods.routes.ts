import type { FastifyPluginAsync } from 'fastify'
import { foodSearchQuerySchema, foodIdParamSchema, foodSchema } from '@nutri-ia/shared'
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

  fastify.get('/foods/:id', async (request, reply) => {
    const paramResult = foodIdParamSchema.safeParse(request.params)
    if (!paramResult.success) {
      return reply.status(400).send({ error: 'Validation error', details: paramResult.error.issues })
    }
    const food = await opts.foodService.findById(paramResult.data.id)
    if (!food) {
      return reply.status(404).send({ error: 'Food not found' })
    }
    return reply.send(foodSchema.parse(food))
  })
}
