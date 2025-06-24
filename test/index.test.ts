import { describe, it, expect } from 'vitest';
import { GachaEngine } from '../src/gacha-engine';
import type { RarityInput, GachaEngineConfig } from '../src/types';

const mockPools: RarityInput[] = [
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

const config: GachaEngineConfig = {
    rarityRates: {
        common: 0.8,
        rare: 0.2,
    },
    pools: mockPools,
};

describe('GachaEngine', () => {
    const engine = new GachaEngine(config);

    describe('constructor validation', () => {
        it('should throw if rarity rates are missing', () => {
            expect(() => new GachaEngine({
                rarityRates: { common: 0.8 }, // missing 'rare'
                pools: mockPools,
            })).toThrow('Missing rarity rates for: rare');
        });

        it('should throw if pool has no items', () => {
            expect(() => new GachaEngine({
                rarityRates: { empty: 1.0 },
                pools: [{ rarity: 'empty', items: [] }],
            })).toThrow('Rarity "empty" has no items');
        });

        it('should throw if pool has zero total weight', () => {
            expect(() => new GachaEngine({
                rarityRates: { zero: 1.0 },
                pools: [{ rarity: 'zero', items: [{ name: 'Item', weight: 0 }] }],
            })).toThrow('Rarity "zero" has zero total weight');
        });
    });

    describe('getItemDropRate', () => {
        it('should return correct drop rate using rarityRates', () => {
            expect(engine.getItemDropRate('ItemA')).toBeCloseTo(0.4); // (0.5/1.0) * 0.8
            expect(engine.getItemDropRate('ItemD')).toBeCloseTo(0.06); // (0.3/1.0) * 0.2
        });

        it('throws if item does not exist', () => {
            expect(() => engine.getItemDropRate('Unknown')).toThrow('Item "Unknown" not found');
        });
    });

    describe('getRarityProbability', () => {
        it('should return correct base rarity rate', () => {
            expect(engine.getRarityProbability('common')).toBe(0.8);
            expect(engine.getRarityProbability('rare')).toBe(0.2);
        });

        it('throws if rarity not found', () => {
            expect(() => engine.getRarityProbability('epic')).toThrow('Rarity "epic" not found');
        });
    });

    describe('getCumulativeProbabilityForItem', () => {
        it('should calculate cumulative probability correctly', () => {
            const dropRate = engine.getItemDropRate('ItemA'); // 0.4
            const rolls = 3;
            const expected = 1 - Math.pow(1 - dropRate, rolls);
            expect(engine.getCumulativeProbabilityForItem('ItemA', rolls)).toBeCloseTo(expected);
        });
    });

    describe('getRollsForTargetProbability', () => {
        it('should calculate rolls to reach target probability', () => {
            const target = 0.9;
            const rate = engine.getItemDropRate('ItemA'); // 0.4
            const expected = Math.ceil(Math.log(1 - target) / Math.log(1 - rate));
            expect(engine.getRollsForTargetProbability('ItemA', target)).toBe(expected);
        });

        it('returns Infinity if drop rate is zero', () => {
            const zeroRateEngine = new GachaEngine({
                rarityRates: { none: 1.0 },
                pools: [{
                    rarity: 'none',
                    items: [
                        { name: 'NeverDrops', weight: 0 },
                        { name: 'Other', weight: 1 },
                    ],
                }],
            });

            expect(zeroRateEngine.getRollsForTargetProbability('NeverDrops', 0.5)).toBe(Infinity);
        });
    });

    describe('getRateUpItems', () => {
        it('returns only rate-up item names', () => {
            expect(engine.getRateUpItems()).toEqual(['ItemD']);
        });

        it('returns empty array if no rate-up items', () => {
            const noRateUpEngine = new GachaEngine({
                rarityRates: { common: 1.0 },
                pools: [{
                    rarity: 'common',
                    items: [{ name: 'NoRateUp', weight: 1 }],
                }],
            });
            expect(noRateUpEngine.getRateUpItems()).toEqual([]);
        });
    });

    describe('getAllItemDropRates', () => {
        it('returns all items with correct drop rates and rarities', () => {
            const results = engine.getAllItemDropRates();
            expect(results).toContainEqual({ name: 'ItemA', dropRate: 0.4, rarity: 'common' });
            expect(results).toContainEqual({ name: 'ItemD', dropRate: 0.06, rarity: 'rare' });
            expect(results).toHaveLength(4);
        });
    });

    describe('roll', () => {
        it('should return array of item names', () => {
            const results = engine.roll(10);
            expect(results).toHaveLength(10);
            expect(results.every(name => ['ItemA', 'ItemB', 'ItemC', 'ItemD'].includes(name))).toBe(true);
        });

        it('should return single item by default', () => {
            const result = engine.roll();
            expect(result).toHaveLength(1);
        });
    });
});