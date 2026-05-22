import type { FoodRepository, FoodWithMeasures } from '../repositories/food.repository'

export class FoodService {
  constructor(private readonly foodRepository: FoodRepository) {}

  async findById(id: string): Promise<FoodWithMeasures | null> {
    return this.foodRepository.findById(id)
  }

  async search(query: string, limit: number): Promise<FoodWithMeasures[]> {
    return this.foodRepository.search(query, limit)
  }
}
