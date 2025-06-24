import { RarityInput, GachaEngineConfig } from './types';

export class GachaEngine {
    private pools: RarityInput[];
    private rarityRates: Record<string, number>;
    private dropRateCache = new Map<string, number>();

    constructor({ rarityRates, pools }: GachaEngineConfig) {
        this.pools = pools;
        this.rarityRates = rarityRates;
        this.validateConfig();
    }

    private validateConfig(): void {
        const configuredRarities = new Set(Object.keys(this.rarityRates));
        const usedRarities = new Set(this.pools.map(p => p.rarity));
        const missing = [...usedRarities].filter(r => !configuredRarities.has(r));
        if (missing.length > 0) {
            throw new Error(`Missing rarity rates for: ${missing.join(', ')}`);
        }

        for (const pool of this.pools) {
            if (pool.items.length === 0) {
                throw new Error(`Rarity "${pool.rarity}" has no items`);
            }
            const totalWeight = pool.items.reduce((sum, i) => sum + i.weight, 0);
            if (totalWeight <= 0) {
                throw new Error(`Rarity "${pool.rarity}" has zero total weight`);
            }
        }
    }

    getItemDropRate(name: string): number {
        if (this.dropRateCache.has(name)) {
            return this.dropRateCache.get(name)!;
        }

        for (const pool of this.pools) {
            const item = pool.items.find(i => i.name === name);
            if (item) {
                const totalPoolWeight = pool.items.reduce((sum, i) => sum + i.weight, 0);
                const baseRarityRate = this.rarityRates[pool.rarity];
                const rate = (item.weight / totalPoolWeight) * baseRarityRate;
                this.dropRateCache.set(name, rate);
                return rate;
            }
        }
        throw new Error(`Item "${name}" not found`);
    }

    getRarityProbability(rarity: string): number {
        if (!this.rarityRates[rarity]) {
            throw new Error(`Rarity "${rarity}" not found`);
        }
        return this.rarityRates[rarity];
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

    roll(count: number = 1): string[] {
        const results: string[] = [];
        for (let i = 0; i < count; i++) {
            const rarity = this.selectRarity();
            const pool = this.pools.find(p => p.rarity === rarity)!;
            const item = this.selectItemFromPool(pool);
            results.push(item.name);
        }
        return results;
    }

    private selectRarity(): string {
        const rand = Math.random();
        let cumulative = 0;
        for (const [rarity, rate] of Object.entries(this.rarityRates)) {
            cumulative += rate;
            if (rand <= cumulative) return rarity;
        }
        return Object.keys(this.rarityRates)[0];
    }

    private selectItemFromPool(pool: RarityInput): { name: string; weight: number } {
        const totalWeight = pool.items.reduce((sum, i) => sum + i.weight, 0);
        const rand = Math.random() * totalWeight;
        let cumulative = 0;
        for (const item of pool.items) {
            cumulative += item.weight;
            if (rand <= cumulative) return item;
        }
        return pool.items[0];
    }
}