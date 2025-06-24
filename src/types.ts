export interface RarityInput {
    rarity: string;
    items: GachaItem[];
}

export interface GachaItem {
    name: string;
    /** 
     * Weight determines relative probability within the rarity tier.
     * Can be fractional (e.g., 0.5, 1.2) - will be converted to scaled integers internally.
     * Use weight: 0 for items that should never drop (useful for placeholders or disabled items).
     * Higher weights = higher probability within the rarity tier.
     */
    weight: number;
    rateUp?: boolean;
}

export interface GachaEngineConfig {
    /** 
     * Probability rates for each rarity tier.
     * Must sum to exactly 1.0.
     * Example: { "common": 0.85, "rare": 0.12, "legendary": 0.03 }
     */
    rarityRates: Record<string, number>;
    /** Array of rarity pools containing items */
    pools: RarityInput[];
}