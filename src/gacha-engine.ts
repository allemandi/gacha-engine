import {
  RarityInput,
  GachaEngineConfig,
  WeightedGachaEngineConfig,
  FlatRateGachaEngineConfig,
} from './types';

export class GachaEngine {
  private static readonly SCALE = 1_000_000;
  private static readonly MAX_SAFE_SCALE = Math.floor(Number.MAX_SAFE_INTEGER / GachaEngine.SCALE);

  private mode: 'weighted' | 'flatRate';
  private pools: RarityInput[] = [];
  private rarityRatesScaled: Record<string, number> = {};
  private flatRateMap: Map<string, number> = new Map();
  private dropRateCacheScaled = new Map<string, number>();

  constructor(config: GachaEngineConfig) {
    this.mode = config.mode;

    if (config.mode === 'weighted') {
      const weightedConfig = config as WeightedGachaEngineConfig;
      this.pools = weightedConfig.pools;
      this.rarityRatesScaled = this.scaleRarityRates(weightedConfig.rarityRates);
      this.validateConfig(weightedConfig.rarityRates);
    } else if (config.mode === 'flatRate') {
      const flatConfig = config as FlatRateGachaEngineConfig;
      for (const pool of flatConfig.pools) {
        for (const item of pool.items) {
          if (item.weight < 0) {
            throw new Error(`FlatRate item "${item.name}" must have non-negative weight`);
          }
          this.flatRateMap.set(item.name, item.weight); // Here, interpreted as direct probability
        }
      }
      const total = Array.from(this.flatRateMap.values()).reduce((sum, v) => sum + v, 0);
      if (Math.abs(total - 1.0) > 1e-6) {
        throw new Error(`FlatRate item rates must sum to 1.0, but got ${total}`);
      }
    } else {
      throw new Error(`Unknown gacha mode: ${this.mode}`);
    }
  }

  private scaleRarityRates(rarityRates: Record<string, number>): Record<string, number> {
    const scaled: Record<string, number> = {};
    for (const [rarity, rate] of Object.entries(rarityRates)) {
      if (rate < 0 || rate > 1) {
        throw new Error(`Rarity rate for "${rarity}" must be between 0 and 1, got ${rate}`);
      }
      scaled[rarity] = this.toScaled(rate);
    }
    return scaled;
  }

  private toScaled(probability: number): number {
    if (probability > GachaEngine.MAX_SAFE_SCALE / GachaEngine.SCALE) {
      throw new Error(`Probability ${probability} too large for safe integer arithmetic`);
    }
    return Math.round(probability * GachaEngine.SCALE);
  }

  private fromScaled(scaledInt: number): number {
    return scaledInt / GachaEngine.SCALE;
  }

  private validateConfig(originalRates: Record<string, number>): void {
    const configuredRarities = new Set(Object.keys(this.rarityRatesScaled));
    const usedRarities = new Set(this.pools.map(p => p.rarity));
    const missing = Array.from(usedRarities).filter(r => !configuredRarities.has(r));

    if (missing.length > 0) {
      throw new Error(`Missing rarity rates for: ${missing.join(', ')}`);
    }

    const totalRate = Object.values(originalRates).reduce((sum, rate) => sum + rate, 0);
    if (Math.abs(totalRate - 1.0) > 1e-10) {
      throw new Error(`Rarity rates must sum to 1.0, got ${totalRate}`);
    }

    for (const pool of this.pools) {
      if (pool.items.length === 0) {
        throw new Error(`Rarity "${pool.rarity}" has no items`);
      }

      const totalWeight = pool.items.reduce((sum, i) => sum + i.weight, 0);
      if (totalWeight <= 0) {
        throw new Error(`Rarity "${pool.rarity}" has zero total weight`);
      }

      for (const item of pool.items) {
        if (item.weight < 0) {
          throw new Error(`Item "${item.name}" weight must be non-negative, got ${item.weight}`);
        }
      }

      if (!pool.items.some(i => i.weight > 0)) {
        throw new Error(`Rarity "${pool.rarity}" must have at least one item with positive weight`);
      }
    }
  }

  getItemDropRate(name: string): number {
    if (this.mode === 'flatRate') {
      return this.flatRateMap.get(name) || 0;
    }

    if (this.dropRateCacheScaled.has(name)) {
      return this.fromScaled(this.dropRateCacheScaled.get(name)!);
    }

    for (const pool of this.pools) {
      const item = pool.items.find(i => i.name === name);
      if (item) {
        if (item.weight === 0) {
          this.dropRateCacheScaled.set(name, 0);
          return 0;
        }

        const totalPoolWeight = pool.items.reduce((sum, i) => sum + i.weight, 0);
        const baseRarityRateScaled = this.rarityRatesScaled[pool.rarity];
        const itemWeightScaled = this.toScaled(item.weight);
        const totalWeightScaled = this.toScaled(totalPoolWeight);
        const numeratorScaled = Math.round((itemWeightScaled * baseRarityRateScaled) / GachaEngine.SCALE);
        const rateScaled = Math.round((numeratorScaled * GachaEngine.SCALE) / totalWeightScaled);

        this.dropRateCacheScaled.set(name, rateScaled);
        return this.fromScaled(rateScaled);
      }
    }

    throw new Error(`Item "${name}" not found`);
  }

  getCumulativeProbabilityForItem(name: string, rolls: number): number {
    const rate = this.getItemDropRate(name);
    if (rate === 0) return 0;
    if (rate >= 1) return 1;

    const cumulativeFailProbability = Math.pow(1 - rate, rolls);
    return 1 - cumulativeFailProbability;
  }

  getRollsForTargetProbability(name: string, targetProbability: number): number {
    if (targetProbability <= 0) return 0;
    if (targetProbability >= 1) return 1;

    const rate = this.getItemDropRate(name);
    if (rate <= 0) return Infinity;
    return Math.ceil(Math.log(1 - targetProbability) / Math.log(1 - rate));
  }

 getRateUpItems(): string[] {
  if (this.mode === 'weighted') {
    return this.pools.flatMap(p => p.items.filter(i => i.rateUp).map(i => i.name));
  } else {
    if (this.pools.length > 0) {
      return this.pools.flatMap(p => p.items.filter(i => i.rateUp).map(i => i.name));
    }
    return [];
  }
}


  getAllItemDropRates(): { name: string; dropRate: number; rarity: string }[] {
    if (this.mode === 'flatRate') {
      return Array.from(this.flatRateMap.entries()).map(([name, dropRate]) => ({
        name,
        dropRate,
        rarity: 'flatRate',
      }));
    }

    return this.pools.flatMap(p =>
      p.items.map(i => ({
        name: i.name,
        dropRate: this.getItemDropRate(i.name),
        rarity: p.rarity,
      }))
    );
  }

  roll(count: number = 1): string[] {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      if (this.mode === 'flatRate') {
        const rand = Math.random();
        let cumulative = 0;
        for (const [name, rate] of this.flatRateMap.entries()) {
          cumulative += rate;
          if (rand < cumulative) {
            results.push(name);
            break;
          }
        }
      } else {
        const rarity = this.selectRarity();
        const pool = this.pools.find(p => p.rarity === rarity)!;
        const item = this.selectItemFromPool(pool);
        results.push(item.name);
      }
    }
    return results;
  }

  private selectRarity(): string {
    const rand = Math.floor(Math.random() * GachaEngine.SCALE);
    let cumulative = 0;

    for (const [rarity, scaledRate] of Object.entries(this.rarityRatesScaled)) {
      cumulative += scaledRate;
      if (rand < cumulative) return rarity;
    }

    return Object.keys(this.rarityRatesScaled)[0];
  }

  private selectItemFromPool(pool: RarityInput): { name: string; weight: number } {
    const items = pool.items.filter(i => i.weight > 0);
    const scaledItems = items.map(i => ({
      ...i,
      scaledWeight: this.toScaled(i.weight),
    }));

    const totalScaledWeight = scaledItems.reduce((sum, i) => sum + i.scaledWeight, 0);
    const rand = Math.floor(Math.random() * totalScaledWeight);
    let cumulative = 0;

    for (const item of scaledItems) {
      cumulative += item.scaledWeight;
      if (rand < cumulative) {
        return { name: item.name, weight: item.weight };
      }
    }

    return items[0]; // Fallback
  }

  getDebugInfo(): {
    scale: number;
    rarityRatesScaled: Record<string, number>;
    rarityRatesFloat: Record<string, number>;
  } {
    const rarityRatesFloat: Record<string, number> = {};
    for (const [rarity, scaledRate] of Object.entries(this.rarityRatesScaled)) {
      rarityRatesFloat[rarity] = this.fromScaled(scaledRate);
    }

    return {
      scale: GachaEngine.SCALE,
      rarityRatesScaled: { ...this.rarityRatesScaled },
      rarityRatesFloat,
    };
  }
}
