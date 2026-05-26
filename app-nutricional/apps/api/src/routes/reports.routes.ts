import type { FastifyPluginAsync } from 'fastify'
import { dailyReportQuerySchema } from '@nutri-ia/shared'
import type { ReportService } from '../services/report.service'
import { authenticate } from '../middlewares/authenticate'

interface ReportsPluginOptions {
  reportService: ReportService
}

export const reportsPlugin: FastifyPluginAsync<ReportsPluginOptions> = async (fastify, opts) => {
  fastify.get('/reports/daily', { preHandler: authenticate }, async (request, reply) => {
    const result = dailyReportQuerySchema.safeParse(request.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }
    const report = await opts.reportService.getDailyReport(request.user.id, result.data.date)
    return reply.send(report)
  })
}
