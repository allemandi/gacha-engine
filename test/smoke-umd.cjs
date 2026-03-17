// Mocking global objects to test UMD in Node.js environment
const myExports = {};
const myModule = { exports: myExports };

const fs = require('fs');
const path = require('path');
const umdCode = fs.readFileSync(path.join(__dirname, '../dist/index.umd.js'), 'utf8');

// Evaluate UMD code in a context where 'exports' and 'module' are defined
(function(exports, module) {
    eval(umdCode);
})(myExports, myModule);

const { GachaEngine } = myModule.exports;
const assert = require('assert');

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

console.log('UMD smoke test passed!');
