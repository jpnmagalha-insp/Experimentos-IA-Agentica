import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FoodRepository } from './food.repository'
import { prisma } from '../lib/prisma'

describe('FoodRepository.search', () => {
  let paoFrancesId: string
  let arrozBrancoId: string
  let arrozId: string

  beforeAll(async () => {
    const pao = await prisma.food.create({
      data: {
        name: 'Pão francês',
        caloriesPer100g: 300,
        proteinPer100g: 9.0,
        fatPer100g: 3.1,
        carbPer100g: 58.6,
        measures: {
          create: [{ description: 'unidade média', gramsEquivalent: 50 }],
        },
      },
    })
    paoFrancesId = pao.id

    const arrozBranco = await prisma.food.create({
      data: {
        name: 'Arroz branco cozido',
        caloriesPer100g: 128,
        proteinPer100g: 2.5,
        fatPer100g: 0.2,
        carbPer100g: 28.1,
      },
    })
    arrozBrancoId = arrozBranco.id

    const arroz = await prisma.food.create({
      data: {
        name: 'Arroz',
        caloriesPer100g: 360,
        proteinPer100g: 7.2,
        fatPer100g: 0.6,
        carbPer100g: 79.0,
      },
    })
    arrozId = arroz.id
  })

  afterAll(async () => {
    await prisma.foodMeasure.deleteMany({ where: { foodId: paoFrancesId } })
    await prisma.food.deleteMany({
      where: { id: { in: [paoFrancesId, arrozBrancoId, arrozId] } },
    })
  })

  const repo = new FoodRepository()

  it('encontra alimento por trecho do nome (case-insensitive)', async () => {
    const results = await repo.search('Pão', 10)
    expect(results.some(f => f.id === paoFrancesId)).toBe(true)
  })

  it('encontra alimento sem acento (unaccent DR-11)', async () => {
    const results = await repo.search('pao frances', 10)
    expect(results.some(f => f.id === paoFrancesId)).toBe(true)
  })

  it('retorna lista vazia quando nada encontrado', async () => {
    const results = await repo.search('xyzimpossivel99', 10)
    expect(results).toEqual([])
  })

  it('inclui measures[] em cada resultado', async () => {
    const results = await repo.search('Pão', 10)
    const food = results.find(f => f.id === paoFrancesId)
    expect(food?.measures).toBeInstanceOf(Array)
    expect(food?.measures.length).toBeGreaterThan(0)
    expect(food?.measures[0]).toMatchObject({
      description: 'unidade média',
      gramsEquivalent: 50,
    })
  })

  it('respeita o parâmetro limit', async () => {
    const results = await repo.search('Arroz', 1)
    expect(results.length).toBe(1)
  })

  it('prioriza match exato antes do parcial', async () => {
    const results = await repo.search('Arroz', 10)
    const exactIndex = results.findIndex(f => f.id === arrozId)
    const partialIndex = results.findIndex(f => f.id === arrozBrancoId)
    expect(exactIndex).toBeLessThan(partialIndex)
  })
})

describe('FoodRepository.findById', () => {
  let foodId: string
  let measureId: string

  const repo = new FoodRepository()

  beforeAll(async () => {
    const food = await prisma.food.create({
      data: {
        name: 'Frango grelhado',
        caloriesPer100g: 165,
        proteinPer100g: 31.0,
        fatPer100g: 3.6,
        carbPer100g: 0.0,
        category: 'Carnes e derivados',
        measures: {
          create: [{ description: 'filé médio', gramsEquivalent: 120 }],
        },
      },
      include: { measures: true },
    })
    foodId = food.id
    measureId = food.measures[0].id
  })

  afterAll(async () => {
    await prisma.foodMeasure.deleteMany({ where: { foodId } })
    await prisma.food.deleteMany({ where: { id: foodId } })
  })

  it('retorna FoodWithMeasures com todos os campos nutricionais quando food existe', async () => {
    const result = await repo.findById(foodId)

    expect(result).not.toBeNull()
    expect(result!.id).toBe(foodId)
    expect(result!.name).toBe('Frango grelhado')
    expect(result!.caloriesPer100g).toBe(165)
    expect(result!.proteinPer100g).toBe(31.0)
    expect(result!.fatPer100g).toBe(3.6)
    expect(result!.carbPer100g).toBe(0.0)
  })

  it('retorna null quando food não existe (UUID inexistente)', async () => {
    const result = await repo.findById('00000000-0000-0000-0000-000000000000')

    expect(result).toBeNull()
  })

  it('retorna measures[] com os campos id, description e gramsEquivalent', async () => {
    const result = await repo.findById(foodId)

    expect(result!.measures).toBeInstanceOf(Array)
    expect(result!.measures.length).toBeGreaterThan(0)
    expect(result!.measures[0]).toMatchObject({
      id: measureId,
      description: 'filé médio',
      gramsEquivalent: 120,
    })
  })
})
