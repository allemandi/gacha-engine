export interface RarityInput {
    rarity: string;
    items: GachaItem[];
}

export interface GachaItem {
    name: string;
    weight: number;
    rateUp?: boolean;
}

export interface GachaEngineConfig {
    rarityRates: Record<string, number>;
    pools: RarityInput[];
}