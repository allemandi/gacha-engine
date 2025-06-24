import { RarityInput, GachaEngineConfig } from './types';
export class GachaEngine {
  private pools: RarityInput[];
  private rarityRates: Record<string, number>;

  constructor({ rarityRates = {}, pools }: GachaEngineConfig) {
    this.pools = pools;
    this.rarityRates = rarityRates;
  }

  getItemDropRate(name: string): number {
    for (const pool of this.pools) {
      const item = pool.items.find(i => i.name === name);
      if (item) {
        const totalPoolProb = pool.items.reduce((sum, i) => sum + i.probability, 0);
        const baseRarityRate = this.rarityRates[pool.rarity] ?? totalPoolProb;
        return (item.probability / totalPoolProb) * baseRarityRate;
      }
    }
    throw new Error(`Item "${name}" not found`);
  }

  getRarityProbability(rarity: string): number {
    const pool = this.pools.find(p => p.rarity === rarity);
    if (!pool) throw new Error(`Rarity "${rarity}" not found`);

    const totalProb = pool.items.reduce((sum, i) => sum + i.probability, 0);
    const baseRate = this.rarityRates[rarity] ?? totalProb;
    return baseRate;
  }

  getCumulativeProbabilityForItem(name: string, rolls: number): number {
    const rate = this.getItemDropRate(name);
    return 1 - Math.pow(1 - rate, rolls);
  }

  getRollsForTargetProbability(name: string, targetProbability: number): number {
    const rate = this.getItemDropRate(name);
    if (rate <= 0) return Infinity;
    return Math.ceil(Math.log(1 - targetProbability) / Math.log(1 - rate));
  }

  getRateUpItems(): string[] {
    return this.pools.flatMap(p =>
      p.items.filter(i => i.rateUp).map(i => i.name)
    );
  }

  getAllItemDropRates(): { name: string; dropRate: number; rarity: string }[] {
    return this.pools.flatMap(p =>
      p.items.map(i => ({
        name: i.name,
        dropRate: this.getItemDropRate(i.name),
        rarity: p.rarity
      }))
    );
  }
}
