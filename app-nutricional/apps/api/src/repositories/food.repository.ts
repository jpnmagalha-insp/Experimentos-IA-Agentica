import { prisma } from '../lib/prisma'
import type { Food, FoodMeasure } from '@prisma/client'

export type FoodWithMeasures = Food & { measures: FoodMeasure[] }

export class FoodRepository {
  async search(query: string, limit: number): Promise<FoodWithMeasures[]> {
    const pattern = `%${query}%`

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM foods
      WHERE unaccent(lower(name)) ILIKE unaccent(lower(${pattern}))
      ORDER BY
        CASE WHEN unaccent(lower(name)) = unaccent(lower(${query})) THEN 0 ELSE 1 END,
        name
      LIMIT ${limit}
    `

    if (rows.length === 0) return []

    const ids = rows.map(r => r.id)

    const foods = await prisma.food.findMany({
      where: { id: { in: ids } },
      include: { measures: true },
    })

    // Restaura a ordem retornada pelo SQL (match exato primeiro, depois alfabético)
    return ids
      .map(id => foods.find(f => f.id === id))
      .filter((f): f is FoodWithMeasures => f !== undefined)
  }
}
