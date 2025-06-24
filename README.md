# 📖 @allemandi/gacha-engine

[![NPM Version](https://img.shields.io/npm/v/@allemandi/gacha-engine)](https://www.npmjs.com/package/@allemandi/gacha-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/allemandi/gacha-engine/blob/main/LICENSE)

> **Practical, type-safe toolkit for simulating and understanding gacha rates and rate-ups.**  
> Supports `"weighted"` and `"flatRate"` modes for different gacha strategies.  
> Works in Node.js and browsers – supports ESM, CommonJS, and UMD.

---

<!-- omit from toc -->
## 🔖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Installation](#️-installation)
- [🚀 Quick Usage Examples](#-quick-usage-examples)
- [📘 API](#-api)
- [🧪 Tests](#-tests)
- [🔗 Related Projects](#-related-projects)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

- 🎲 **Roll simulation** – Perform gacha rolls with weighted or flat-rate logic  
- 🔍 **Probability analysis** – Drop rates, cumulative probabilities, target probabilities  
- 📐 **Multi-rarity support** – Flexible rarity-based or item-based probability distributions  
- ⚡ **Performance optimized** – Efficient with cached calculations  
- 🛡️ **Type-safe** – Written in TypeScript with strict configuration validation

---

## 🛠️ Installation
```bash
# Yarn
yarn add @allemandi/gacha-engine

# NPM
npm install @allemandi/gacha-engine
```


## 🚀 Quick Usage Examples

**ESM (Weighted Mode)**
```js
import { GachaEngine } from '@allemandi/gacha-engine';

const pools = [
  {
    rarity: 'SSR',
    items: [
      { name: 'Super Hobo', weight: 0.8, rateUp: true },
      { name: 'Broke King', weight: 0.4 },
      { name: 'Cardboard Hero', weight: 0.4 }
    ]
  },
  {
    rarity: 'SR',
    items: [
      { name: 'Cold Salaryman', weight: 1.5, rateUp: true },
      { name: 'Numb Artist', weight: 1.8 },
      { name: 'Crying Cook', weight: 1.8 }
    ]
  },
  {
    rarity: 'R',
    items: [
      { name: 'Regular Joe', weight: 5.0 },
      { name: 'Normal Person', weight: 5.0 }
    ]
  }
];

const rarityRates = {
  SSR: 0.01,
  SR: 0.05,
  R: 0.94
};

const engine = new GachaEngine({ mode: 'weighted', pools, rarityRates });

console.log('10 rolls:', engine.roll(10).join(', '));

const rate = engine.getItemDropRate('Super Hobo');
console.log('Drop rate for Super Hobo:', (rate * 100).toFixed(3) + '%');
// ~0.4% → (0.8 / 1.6) * 0.01 = 0.005 → 0.5%

const cumulative = engine.getCumulativeProbabilityForItem('Super Hobo', 300);
console.log('Probability in 300 rolls:', (cumulative * 100).toFixed(1) + '%');
// ~77.7%

console.log('Rolls for 50% chance:', engine.getRollsForTargetProbability('Super Hobo', 0.5));
// ~138

console.log('Rate-up items:', engine.getRateUpItems().join(', '));
// Super Hobo, Cold Salaryman

console.log('All items:', engine.getAllItems().join(', '));
// Super Hobo, Broke King, Cardboard Hero, Cold Salaryman, Numb Artist, Crying Cook, Regular Joe, Normal Person
```

**CommonJS (Flat Mode)**
```js
const { GachaEngine } = require('@allemandi/gacha-engine');

const pools = [
  {
    rarity: 'SSR',
    items: [
      { name: 'God-Tier Rat', flatRate: 0.003, rateUp: true },
      { name: 'Dumpster King', flatRate: 0.002 }
    ]
  },
  {
    rarity: 'SR',
    items: [
      { name: 'Sleepy Chef', flatRate: 0.015 }
    ]
  },
  {
    rarity: 'R',
    items: [
      { name: 'Unknown Student', flatRate: 0.1 }
    ]
  }
];

const engine = new GachaEngine({ mode: 'flat', pools });

console.log('Roll x5:', engine.roll(5).join(', '));

const dropRate = engine.getItemDropRate('God-Tier Rat');
console.log('Drop rate for God-Tier Rat:', (dropRate * 100).toFixed(3) + '%');
// 0.3%

const cumulative = engine.getCumulativeProbabilityForItem('God-Tier Rat', 500);
console.log('Chance after 500 rolls:', (cumulative * 100).toFixed(1) + '%');
// ~78.5%

const rollsFor50 = engine.getRollsForTargetProbability('God-Tier Rat', 0.5);
console.log('Rolls for 50% chance:', rollsFor50);
// ~231

console.log('Rate-up items:', engine.getRateUpItems().join(', '));
// God-Tier Rat

console.log('All items:', engine.getAllItems().join(', '));
// God-Tier Rat, Dumpster King, Sleepy Chef, Unknown Student
```

**UMD (Browser, Weighted Mode)**
```html
<script src="https://unpkg.com/@allemandi/gacha-engine"></script>
<script>
  const { GachaEngine } = window.AllemandiGachaEngine;

  const engine = new GachaEngine({
    mode: 'weighted',
    rarityRates: {
      SSR: 0.02,
      SR: 0.08,
      R: 0.90
    },
    pools: [
      {
        rarity: 'SSR',
        items: [
          { name: 'Trash Wizard', weight: 1.0 },
          { name: 'Park Master', weight: 1.0, rateUp: true }
        ]
      },
      {
        rarity: 'SR',
        items: [
          { name: 'Street Sweeper', weight: 2.0 },
          { name: 'Bench Philosopher', weight: 1.0 }
        ]
      },
      {
        rarity: 'R',
        items: [
          { name: 'Bus Stop Ghost', weight: 5.0 }
        ]
      }
    ]
  });

  const rate = engine.getItemDropRate('Park Master');
  const rolls = engine.getRollsForTargetProbability('Park Master', 0.75);
  const cumulative = engine.getCumulativeProbabilityForItem('Park Master', 200);

  console.log('1x Roll:', engine.roll());
  console.log('Drop rate for Park Master:', (rate * 100).toFixed(2) + '%');
  // 1.0 / 2.0 * 0.02 = 0.01 → 1.00%

  console.log('Cumulative 200 rolls:', (cumulative * 100).toFixed(1) + '%');
  // ~86.6%

  console.log('Rolls for 75% chance:', rolls);
  // ~139

  console.log('Rate-up items:', engine.getRateUpItems().join(', '));
  // Park Master

  console.log('All items:', engine.getAllItems().join(', '));
  // Trash Wizard, Park Master, Street Sweeper, Bench Philosopher, Bus Stop Ghost
</script>
```

## 📘 API

### Constructor
`new GachaEngine(config: GachaEngineConfig)`

Creates a new GachaEngine instance with validation.

**Config Options:**

- Weighted Mode 
```ts
{
  mode: 'weighted'; // (default)
  rarityRates: Record<string, number>; // Required: must sum to 1.0
  pools: Array<{
    rarity: string; // Must match a key in `rarityRates`
    items: Array<{
      name: string;
      weight: number;
      rateUp?: boolean;
    }>
  }>
}
```
- Flat Rate Mode

```ts
{
  mode: 'flatRate';
  pools: Array<{
    rarity: string; // Used only for categorization
    items: Array<{
      name: string;
      weight: number; // Interpreted as direct probability (must sum to 1.0 across all items)
      rateUp?: boolean;
    }>
  }>
}
```

### Methods

#### Rolling
`roll(count?: number): string[]`
- Simulate gacha rolls and returns item names
- `count`: Number of rolls to perform (default: 1)
- Returns array of item names

#### Analysis
`getItemDropRate(name: string): number`
- Returns the effective drop rate for a specific item
  - In weighted mode:
    - Computed as `dropRate = (item.weight / totalPoolWeight) × rarityBaseRate`
  - In flat rate mode:
    - `Returns the item's defined probability.
  - Throws if the item does not exist.

`getRarityProbability(rarity: string): number`
- Returns the base probability for a given rarity tier
  - Only in "weighted" mode.
  - Throws in flatRate mode.

`getCumulativeProbabilityForItem(name: string, rolls: number): number`
- Calculates probability of getting the item at least once in N rolls
- Uses formula: `1 - (1 - dropRate)^rolls`

`getRollsForTargetProbability(name: string, targetProbability: number): number`
- Calculates the minimum number of rolls needed to reach a specific probability of pulling a given item.
- Returns `Infinity` if item has zero drop rate
- Returns 1 if target probability ≥ 1.0

#### Utility
`getRateUpItems(): string[]`
- Returns names of all items marked with `rateUp: true`

`getAllItemDropRates(): Array<{name: string, dropRate: number, rarity: string}>`
- Returns a list of all items with:
  - name: Item name
  - dropRate: Calculated drop probability
  - rarity: Associated rarity (or "flatRate" in flat mode)

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