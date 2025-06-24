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
- 🔍 Determine how many rolls are needed to reach a target probability for an item
- 📐 Estimate cumulative probabilities over multiple rolls
- ⚡ Lightweight and fast rarity probabilities

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
      { name: 'Ultra Sword', probability: 0.01, rateUp: true },
      { name: 'Magic Wand', probability: 0.02 },
      { name: 'Useless SSR Loot', probability: 0.97 }
    ]
  },
  {
    rarity: 'SR',
    items: [
      { name: 'Steel Shield', probability: 0.1 },
      { name: 'Healing Potion', probability: 0.2 }
    ]
  }
];

const rarityRates = {
  SSR: 0.05,
  SR: 0.3,
};

const engine = new GachaEngine({ pools, rarityRates });

const dropRate = engine.getItemDropRate('Ultra Sword');
console.log(`Drop rate for Ultra Sword: ${dropRate}`);

const cumulativeProb = engine.getCumulativeProbabilityForItem('Ultra Sword', 10);
console.log(`Probability of getting Ultra Sword in 10 rolls: ${cumulativeProb}`);

const rollsNeeded = engine.getRollsForTargetProbability('Ultra Sword', 0.9);
console.log(`Rolls needed for 90% chance: ${rollsNeeded}`);

const rateUpItems = engine.getRateUpItems();
console.log(`Current rate-up items: ${rateUpItems.join(', ')}`);
```

**CommonJS**
```js
const { GachaEngine } = require('@allemandi/gacha-engine');
```

**UMD**
```html
 <script src="https://unpkg.com/@allemandi/gacha-engine"></script>
  <script>
    const engine = new window.AllemandiGachaEngine.GachaEngine({
      pools: [
        {
          rarity: '5★',
          items: [{ name: 'Rate Up Character', probability: 0.008 }]
        }
      ]
    });

    console.log('Rate up:', engine.getItemDropRate('Rate Up Character'));
    // Rate up: 0.008
  </script>
```

## 📘 API
`new GachaEngine(config: GachaEngineConfig)`

Creates a new GachaEngine instance.

- `config.pools`: Array of item pools, each with a rarity and list of items (each with name, probability, optional `rateUp` flag).

- `config.rarityRates`: Optional object mapping rarities to base probabilities.

### Methods
`getItemDropRate(name: string): number`
- Returns the effective drop rate of an item by name.

`getRarityProbability(rarity: string): number`
- Returns the base probability assigned to a rarity pool.

`getCumulativeProbabilityForItem(name: string, rolls: number): number`
- Returns the probability of obtaining the specified item at least once within the given number of rolls.

`getRollsForTargetProbability(name: string, targetProbability: number): number`
- Returns the minimum number of rolls needed to reach or exceed the target probability for the specified item.

`getRateUpItems(): string[]`
- Returns a list of all item names currently marked as rate-up.

`getAllItemDropRates(): { name: string; dropRate: number; rarity: string }[]`
- Returns an array of all items with their calculated drop rates and rarities.

## 🧪 Tests

> Available in the GitHub repo only.

```bash
# Run the test suite with Jest
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