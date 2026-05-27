import Fastify from 'fastify'
import { errorHandler } from './middlewares/error-handler'
import { authRoutes } from './routes/auth.routes'
import { usersRoutes } from './routes/users.routes'
import { foodsPlugin } from './routes/foods.routes'
import { logsPlugin } from './routes/logs.routes'
import { FoodRepository } from './repositories/food.repository'
import { FoodService } from './services/food.service'
import { FoodLogRepository } from './repositories/foodLog.repository'
import { FoodLogService } from './services/foodLog.service'
import { ReportRepository } from './repositories/report.repository'
import { ReportService } from './services/report.service'
import { reportsPlugin } from './routes/reports.routes'

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
    const foodRepository = new FoodRepository()
    const foodService = new FoodService(foodRepository)
    const foodLogRepository = new FoodLogRepository()
    const foodLogService = new FoodLogService(foodLogRepository, foodRepository)
    const reportRepository = new ReportRepository()
    const reportService = new ReportService(reportRepository)

    await fastify.register(errorHandler)
    await fastify.register(authRoutes, { prefix: '/v1' })
    await fastify.register(usersRoutes, { prefix: '/v1' })
    await fastify.register(foodsPlugin, { foodService, prefix: '/v1' })
    await fastify.register(logsPlugin, { logService: foodLogService, prefix: '/v1' })
    await fastify.register(reportsPlugin, { reportService, prefix: '/v1' })

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
    await fastify.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
