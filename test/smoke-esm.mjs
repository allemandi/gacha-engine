import { GachaEngine } from '../dist/index.module.js';
import assert from 'assert';

const config = {
    mode: 'weighted',
    rarityRates: {
        common: 0.8,
        rare: 0.2,
    },
    pools: [
        {
            rarity: 'common',
            items: [{ name: 'ItemA', weight: 1 }],
        },
        {
            rarity: 'rare',
            items: [{ name: 'ItemB', weight: 1 }],
        },
    ],
};

const engine = new GachaEngine(config);
const rateA = engine.getItemDropRate('ItemA');
assert.strictEqual(rateA, 0.8);

const results = engine.roll(10);
assert.strictEqual(results.length, 10);

console.log('ESM smoke test passed!');
