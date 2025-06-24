export interface GachaItem {
  name: string;
  weight: number;
  rateUp?: boolean;
}

export interface RarityInput {
  rarity: string;
  items: GachaItem[];
}

/** Weighted mode requires explicit rarityRates */
export interface WeightedGachaEngineConfig {
  mode: 'weighted';
  rarityRates: Record<string, number>;
  pools: RarityInput[];
}

/** Flat rate mode does NOT use rarityRates */
export interface FlatRateGachaEngineConfig {
  mode: 'flatRate';
  pools: RarityInput[];
}

export type GachaEngineConfig = WeightedGachaEngineConfig | FlatRateGachaEngineConfig;
