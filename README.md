# 📖 @allemandi/gacha-engine

[![NPM Version](https://img.shields.io/npm/v/@allemandi/gacha-engine)](https://www.npmjs.com/package/@allemandi/gacha-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/allemandi/gacha-engine/blob/main/LICENSE)

> **Practical, type-safe toolkit for simulating and understanding gacha rates and rate-ups.**
> 
> Works in Node.js, browsers – supports ESM, CommonJS, and UMD

<!-- omit from toc -->
## 🔖 Table of Contents
- [✨ Features](#-features)
- [🛠️ Installation](#️-installation)
- [🚀 Quick Usage Examples](#-quick-usage-examples)
- [📘 API](#-api)
- [🧪 Tests](#-tests)
- [🔗 Related Projects](#-related-projects)
- [🤝 Contributing](#-contributing)


## ✨ Features
- 🎲 **Roll simulation**: Perform actual gacha rolls with weighted probabilities
- 🔍 **Probability analysis**: Calculate drop rates, cumulative probabilities, and rolls needed
- 📐 **Multi-rarity support**: Handle complex gacha systems with multiple rarity tiers
- ⚡ **Performance optimized**: Cached calculations and efficient algorithms
- 🛡️ **Type-safe**: Full TypeScript support with comprehensive validation

## 🛠️ Installation
```bash
# Yarn
yarn add @allemandi/gacha-engine

# NPM
npm install @allemandi/gacha-engine
```


## 🚀 Quick Usage Examples

**ESM**
```js
import { GachaEngine } from '@allemandi/gacha-engine';

const pools = [
  {
    rarity: 'SSR',
    items: [
      { name: 'Super Hobo', weight: 0.8, rateUp: true },  // Rate-up: 0.8% of SSR pool
      { name: 'Broke King', weight: 0.4 },                     // Standard: 0.4% of SSR pool  
      { name: 'Cardboard Hero', weight: 0.4 },
      { name: 'Newspaper Warmer', weight: 0.4 }
    ]
  },
  {
    rarity: 'SR', 
    items: [
      { name: 'Cold Salaryman', weight: 1.5, rateUp: true },           // Rate-up: 1.5% of SR pool
      { name: 'Numb Artist', weight: 1.8 },                      // Standard 4-star rates
      { name: 'Crying Cook', weight: 1.8 },
      { name: 'Lonely Cat', weight: 1.8 }
    ]
  }
];

const rarityRates = {
  SSR: 0.01,  // 1% chance for SSR (5-star)
  SR: 0.03,   // 3% chance for SR (4-star)
};

const engine = new GachaEngine({ pools, rarityRates });

// Perform actual rolls
const results = engine.roll(10);
console.log(`10 rolls result: ${results.join(', ')}`);

// Analyze probabilities  
const dropRate = engine.getItemDropRate('Super Hobo');
console.log(`Drop rate for Super Hobo: ${(dropRate * 100).toFixed(3)}%`);
// Output: ~0.4% (0.8/2.0 * 0.01)

const cumulativeProb = engine.getCumulativeProbabilityForItem('Super Hobo', 300);
console.log(`Probability of getting Super Hobo in 300 rolls: ${(cumulativeProb * 100).toFixed(1)}%`);

const rollsNeeded = engine.getRollsForTargetProbability('Super Hobo', 0.5);
console.log(`Rolls needed for 50% chance: ${rollsNeeded}`);

const rateUpItems = engine.getRateUpItems();
console.log(`Current rate-up items: ${rateUpItems.join(', ')}`);
// Output: "Super Hobo, Cold Salaryman"
```

**CommonJS**
```js
const { GachaEngine } = require('@allemandi/gacha-engine');
```

**UMD**
```html
<script src="https://unpkg.com/@allemandi/gacha-engine"></script>
<script>
  const engine = new AllemandiGachaEngine.GachaEngine({
    rarityRates: { 'SSR': 0.01 },
    pools: [
      {
        rarity: 'SSR',
        items: [
          { name: 'Park Master', weight: 0.7, rateUp: true },
          { name: 'Trash Titan', weight: 0.3 }
        ]
      }
    ]
  });

  console.log('Single roll:', engine.roll());
  // Single roll: ['Park Master'] or ['Trash Titan']
</script>
```

## 📘 API

### Constructor
`new GachaEngine(config: GachaEngineConfig)`

Creates a new GachaEngine instance with validation.

**Config Properties:**
- `rarityRates` **(required)**: Object mapping rarity names to their base probabilities (must sum to ≤ 1.0)
- `pools` **(required)**: Array of rarity pools, each containing:
  - `rarity`: String identifier matching a key in `rarityRates`
  - `items`: Array of items with:
    - `name`: Unique item identifier
    - `weight`: Relative weight within the rarity pool (higher = more likely)
    - `rateUp?`: Optional boolean flag for rate-up items

### Methods

#### Rolling
`roll(count?: number): string[]`
- Simulate gacha rolls and returns item names
- `count`: Number of rolls to perform (default: 1)
- Returns array of item names

#### Analysis
`getItemDropRate(name: string): number`
- Returns the effective drop rate (0-1) for a specific item
- Calculated as: `(item.weight / pool.totalWeight) × rarity.baseRate`

`getRarityProbability(rarity: string): number`
- Returns the base probability for a rarity tier

`getCumulativeProbabilityForItem(name: string, rolls: number): number`
- Calculates probability of getting the item at least once in N rolls
- Uses formula: `1 - (1 - dropRate)^rolls`

`getRollsForTargetProbability(name: string, targetProbability: number): number`
- Returns minimum rolls needed to reach target probability for an item
- Returns `Infinity` if item has zero drop rate

#### Utility
`getRateUpItems(): string[]`
- Returns names of all items marked with `rateUp: true`

`getAllItemDropRates(): Array<{name: string, dropRate: number, rarity: string}>`
- Returns complete list of all items with their calculated drop rates and rarities

## 🧪 Tests

> Available in the GitHub repo only.

```bash
# Run the test suite with Vitest
yarn test
# or
npm test
```

## 🔗 Related Projects
Check out these related projects that might interest you:

**[@allemandi/embed-utils](https://github.com/allemandi/embed-utils)**
- Fast, type-safe utilities for vector embedding comparison and search.

**[Embed Classify CLI](https://github.com/allemandi/embed-classify-cli)**
- Node.js CLI tool for local text classification using word embeddings.

## 🤝 Contributing
If you have ideas, improvements, or new features:

1. Fork the project
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request