import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface TacoMeasure {
  description: string
  grams_equivalent: number
}

interface TacoFood {
  id: string
  name: string
  category: string | null
  calories_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carb_per_100g: number
  measures: TacoMeasure[]
}

async function main() {
  const dataPath = join(__dirname, 'data', 'taco.json')
  const foods: TacoFood[] = JSON.parse(readFileSync(dataPath, 'utf-8'))

  console.log(`Seeding ${foods.length} foods from TACO v7...`)

  for (const food of foods) {
    const upserted = await prisma.food.upsert({
      where: { tacoId: food.id },
      update: {
        name: food.name,
        category: food.category,
        caloriesPer100g: food.calories_per_100g,
        proteinPer100g: food.protein_per_100g,
        fatPer100g: food.fat_per_100g,
        carbPer100g: food.carb_per_100g,
      },
      create: {
        name: food.name,
        tacoId: food.id,
        category: food.category,
        caloriesPer100g: food.calories_per_100g,
        proteinPer100g: food.protein_per_100g,
        fatPer100g: food.fat_per_100g,
        carbPer100g: food.carb_per_100g,
      },
    })

    await prisma.foodMeasure.deleteMany({ where: { foodId: upserted.id } })

    if (food.measures.length > 0) {
      await prisma.foodMeasure.createMany({
        data: food.measures.map((m) => ({
          foodId: upserted.id,
          description: m.description,
          gramsEquivalent: m.grams_equivalent,
        })),
      })
    }
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
