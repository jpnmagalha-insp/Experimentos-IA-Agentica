import type { FastifyPluginAsync } from 'fastify'
import { createLogSchema, dailyLogsQuerySchema, foodIdParamSchema, updateLogSchema } from '@nutri-ia/shared'
import type { FoodLogService } from '../services/foodLog.service'
import { authenticate } from '../middlewares/authenticate'

interface LogsPluginOptions {
  logService: FoodLogService
}

export const logsPlugin: FastifyPluginAsync<LogsPluginOptions> = async (fastify, opts) => {
  fastify.get('/logs', { preHandler: authenticate }, async (request, reply) => {
    const result = dailyLogsQuerySchema.safeParse(request.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }
    const logs = await opts.logService.getDailyLogs(request.user.id, result.data.date)
    return reply.send(logs)
  })

  fastify.post('/logs', { preHandler: authenticate }, async (request, reply) => {
    const result = createLogSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }
    const log = await opts.logService.createLog(request.user.id, result.data)
    return reply.status(201).send(log)
  })

  fastify.put('/logs/:id', { preHandler: authenticate }, async (request, reply) => {
    const paramsResult = foodIdParamSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return reply.status(400).send({ error: 'Validation error', details: paramsResult.error.issues })
    }
    const bodyResult = updateLogSchema.safeParse(request.body)
    if (!bodyResult.success) {
      return reply.status(400).send({ error: 'Validation error', details: bodyResult.error.issues })
    }
    const log = await opts.logService.updateLog(request.user.id, paramsResult.data.id, bodyResult.data)
    return reply.send(log)
  })
}
