import { describe, it, expect } from 'vitest';
import { GachaEngine } from '../src/gacha-engine';
import type {
    RarityInput,
    WeightedGachaEngineConfig,
    FlatRateGachaEngineConfig,
} from '../src/types';

// --- Weighted mode setup ---
const weightedPools: RarityInput[] = [
    {
        rarity: 'common',
        items: [
            { name: 'ItemA', weight: 0.5 },
            { name: 'ItemB', weight: 0.5 },
        ],
    },
    {
        rarity: 'rare',
        items: [
            { name: 'ItemC', weight: 0.7 },
            { name: 'ItemD', weight: 0.3, rateUp: true },
        ],
    },
];

const weightedConfig: WeightedGachaEngineConfig = {
    mode: 'weighted',
    rarityRates: {
        common: 0.8,
        rare: 0.2,
    },
    pools: weightedPools,
};

// --- FlatRate mode setup ---
const flatRatePools: RarityInput[] = [
    {
        rarity: 'flat',
        items: [
            { name: 'FlatItemA', weight: 0.6 },
            { name: 'FlatItemB', weight: 0.4 },
        ],
    },
];

const flatRateConfig: FlatRateGachaEngineConfig = {
    mode: 'flatRate',
    pools: flatRatePools,
};

describe('GachaEngine Weighted Mode', () => {
    const engine = new GachaEngine(weightedConfig);

    it('throws if rarity rates missing for pools', () => {
        expect(() => {
            new GachaEngine({
                mode: 'weighted',
                rarityRates: { common: 1.0 },
                pools: weightedPools,
            });
        }).toThrow(/Missing rarity rates for: rare/);
    });

    it('calculates correct drop rates', () => {
        expect(engine.getItemDropRate('ItemA')).toBeCloseTo(0.4); // (0.5/1)*0.8
        expect(engine.getItemDropRate('ItemD')).toBeCloseTo(0.06); // (0.3/1)*0.2
    });

    it('returns rate-up items', () => {
        expect(engine.getRateUpItems()).toEqual(['ItemD']);
    });

    it('roll returns correct count and valid items', () => {
        const results = engine.roll(5);
        expect(results.length).toBe(5);
        for (const item of results) {
            expect(['ItemA', 'ItemB', 'ItemC', 'ItemD']).toContain(item);
        }
    });

    it('throws on unknown item drop rate query', () => {
        expect(() => engine.getItemDropRate('Unknown')).toThrow(/Item "Unknown" not found/);
    });
});

describe('GachaEngine FlatRate Mode', () => {
    const engine = new GachaEngine(flatRateConfig);

    it('throws if flatRates do not sum to 1', () => {
        expect(() =>
            new GachaEngine({
                mode: 'flatRate',
                pools: [
                    {
                        rarity: 'flat',
                        items: [
                            { name: 'A', weight: 0.7 },
                            { name: 'B', weight: 0.7 },
                        ],
                    },
                ],
            })
        ).toThrow(/FlatRate item rates must sum to 1.0/);
    });

    it('correctly gets drop rates', () => {
        expect(engine.getItemDropRate('FlatItemA')).toBeCloseTo(0.6);
        expect(engine.getItemDropRate('FlatItemB')).toBeCloseTo(0.4);
    });

    it('roll returns items based on flatRates', () => {
        const results = engine.roll(1000);
        const counts = results.reduce<Record<string, number>>((acc, cur) => {
            acc[cur] = (acc[cur] ?? 0) + 1;
            return acc;
        }, {});

        const freqA = counts['FlatItemA'] / 1000;
        const freqB = counts['FlatItemB'] / 1000;
        expect(freqA).toBeCloseTo(0.6, 1);
        expect(freqB).toBeCloseTo(0.4, 1);
    });
    it('returns 0 for unknown item in flatRate mode', () => {
        expect(engine.getItemDropRate('Unknown')).toBe(0);
    });

});
