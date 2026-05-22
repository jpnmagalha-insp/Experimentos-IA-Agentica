import type { FoodRepository, FoodWithMeasures } from '../repositories/food.repository'

export class FoodService {
  constructor(private readonly foodRepository: FoodRepository) {}

  async search(query: string, limit: number): Promise<FoodWithMeasures[]> {
    return this.foodRepository.search(query, limit)
  }
}
