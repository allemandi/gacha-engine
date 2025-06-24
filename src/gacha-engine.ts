import { RarityInput, GachaEngineConfig } from './types';

export class GachaEngine {
    // Scale factor for fixed-point arithmetic (1,000,000 = 6 decimal places)
    private static readonly SCALE = 1000000;
    private static readonly MAX_SAFE_SCALE = Math.floor(Number.MAX_SAFE_INTEGER / this.SCALE);

    private pools: RarityInput[];
    private rarityRatesScaled: Record<string, number>; // Scaled to integers
    private dropRateCacheScaled = new Map<string, number>(); // Cache scaled rates

    constructor({ rarityRates, pools }: GachaEngineConfig) {
        this.pools = pools;
        this.rarityRatesScaled = this.scaleRarityRates(rarityRates);
        this.validateConfig(rarityRates);
    }

    /**
     * Convert floating point rates to scaled integers
     */
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

    /**
     * Convert probability to scaled integer
     */
    private toScaled(probability: number): number {
        if (probability > GachaEngine.MAX_SAFE_SCALE / GachaEngine.SCALE) {
            throw new Error(`Probability ${probability} too large for safe integer arithmetic`);
        }
        return Math.round(probability * GachaEngine.SCALE);
    }

    /**
     * Convert scaled integer back to probability
     */
    private fromScaled(scaledInt: number): number {
        return scaledInt / GachaEngine.SCALE;
    }

    private validateConfig(originalRates: Record<string, number>): void {
        const configuredRarities = new Set(Object.keys(this.rarityRatesScaled));
        const usedRarities = new Set(this.pools.map(p => p.rarity));
        const missingArray = Array.from(usedRarities).filter(r => !configuredRarities.has(r));
        
        if (missingArray.length > 0) {
            throw new Error(`Missing rarity rates for: ${missingArray.join(', ')}`);
        }

        // Validate that rates sum to exactly 1.0 (within floating point precision)
        const totalRate = Object.values(originalRates).reduce((sum, rate) => sum + rate, 0);
        const totalScaled = Object.values(this.rarityRatesScaled).reduce((sum, rate) => sum + rate, 0);
        
        if (Math.abs(totalRate - 1.0) > 1e-10) {
            throw new Error(`Rarity rates must sum to 1.0, got ${totalRate}`);
        }

        // Ensure scaled rates sum to SCALE (accounting for rounding)
        if (Math.abs(totalScaled - GachaEngine.SCALE) > Object.keys(this.rarityRatesScaled).length) {
            console.warn(`Scaled rates sum to ${totalScaled}, expected ${GachaEngine.SCALE}. This is likely due to rounding.`);
        }

        for (const pool of this.pools) {
            if (pool.items.length === 0) {
                throw new Error(`Rarity "${pool.rarity}" has no items`);
            }
            
            const totalWeight = pool.items.reduce((sum, i) => sum + i.weight, 0);
            if (totalWeight <= 0) {
                throw new Error(`Rarity "${pool.rarity}" has zero total weight`);
            }

            // Validate that all weights are non-negative
            for (const item of pool.items) {
                if (item.weight < 0) {
                    throw new Error(`Item "${item.name}" weight must be non-negative, got ${item.weight}`);
                }
            }

            // Ensure at least one item has positive weight
            const hasPositiveWeight = pool.items.some(item => item.weight > 0);
            if (!hasPositiveWeight) {
                throw new Error(`Rarity "${pool.rarity}" must have at least one item with positive weight`);
            }
        }
    }

    getItemDropRate(name: string): number {
        if (this.dropRateCacheScaled.has(name)) {
            return this.fromScaled(this.dropRateCacheScaled.get(name)!);
        }

        for (const pool of this.pools) {
            const item = pool.items.find(i => i.name === name);
            if (item) {
                // Handle zero weight items (never drop)
                if (item.weight === 0) {
                    this.dropRateCacheScaled.set(name, 0);
                    return 0;
                }

                const totalPoolWeight = pool.items.reduce((sum, i) => sum + i.weight, 0);
                const baseRarityRateScaled = this.rarityRatesScaled[pool.rarity];
                
                // Convert weights to scaled integers for perfect precision
                const itemWeightScaled = this.toScaled(item.weight);
                const totalWeightScaled = this.toScaled(totalPoolWeight);
                
                // Scaled arithmetic: (itemWeight * baseRate) / totalWeight
                const numeratorScaled = Math.round((itemWeightScaled * baseRarityRateScaled) / GachaEngine.SCALE);
                const rateScaled = Math.round((numeratorScaled * GachaEngine.SCALE) / totalWeightScaled);
                
                this.dropRateCacheScaled.set(name, rateScaled);
                return this.fromScaled(rateScaled);
            }
        }
        throw new Error(`Item "${name}" not found`);
    }

    getRarityProbability(rarity: string): number {
        if (!this.rarityRatesScaled[rarity]) {
            throw new Error(`Rarity "${rarity}" not found`);
        }
        return this.fromScaled(this.rarityRatesScaled[rarity]);
    }

    getCumulativeProbabilityForItem(name: string, rolls: number): number {
        const rateScaled = this.getItemDropRateScaled(name);
        
        if (rateScaled === 0) return 0;
        if (rateScaled >= GachaEngine.SCALE) return 1;
        
        // Calculate (1 - rate)^rolls using scaled arithmetic
        const failRateScaled = GachaEngine.SCALE - rateScaled;
        const failRate = this.fromScaled(failRateScaled);
        
        // For large rolls, we need to be careful with precision
        const cumulativeFailProbability = Math.pow(failRate, rolls);
        const cumulativeProbability = 1 - cumulativeFailProbability;
        
        return Math.min(1, Math.max(0, cumulativeProbability));
    }

    getRollsForTargetProbability(name: string, targetProbability: number): number {
        if (targetProbability <= 0) return 0;
        if (targetProbability >= 1) return 1;
        
        const rate = this.getItemDropRate(name);
        if (rate <= 0) return Infinity;
        if (rate >= 1) return 1;
        
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

    /**
     * Get scaled drop rate for internal calculations
     */
    private getItemDropRateScaled(name: string): number {
        if (this.dropRateCacheScaled.has(name)) {
            return this.dropRateCacheScaled.get(name)!;
        }
        
        // Trigger calculation and caching
        this.getItemDropRate(name);
        return this.dropRateCacheScaled.get(name)!;
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
        const rand = Math.floor(Math.random() * GachaEngine.SCALE);
        let cumulativeScaled = 0;
        
        for (const [rarity, rateScaled] of Object.entries(this.rarityRatesScaled)) {
            cumulativeScaled += rateScaled;
            if (rand < cumulativeScaled) return rarity;
        }
        
        // Fallback (should never happen with proper validation)
        return Object.keys(this.rarityRatesScaled)[0];
    }

    private selectItemFromPool(pool: RarityInput): { name: string; weight: number } {
        // Filter out zero-weight items (they can never be selected)
        const selectableItems = pool.items.filter(item => item.weight > 0);
        
        if (selectableItems.length === 0) {
            throw new Error(`No selectable items in pool for rarity "${pool.rarity}"`);
        }

        // Convert all weights to scaled integers for perfect precision
        const scaledItems = selectableItems.map(item => ({
            ...item,
            scaledWeight: this.toScaled(item.weight)
        }));
        
        const totalScaledWeight = scaledItems.reduce((sum, item) => sum + item.scaledWeight, 0);
        const rand = Math.floor(Math.random() * totalScaledWeight);
        let cumulative = 0;
        
        for (const item of scaledItems) {
            cumulative += item.scaledWeight;
            if (rand < cumulative) {
                return { name: item.name, weight: item.weight };
            }
        }
        
        // Fallback (should never happen)
        return selectableItems[0];
    }

    /**
     * Debug method to inspect scaled values
     */
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
            rarityRatesFloat
        };
    }
}