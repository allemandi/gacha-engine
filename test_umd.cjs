require('./dist/index.umd.js');
console.log('Global keys:', Object.keys(global).filter(k => k.includes('Gacha') || k.includes('Allemandi')));
console.log('AllemandiGachaEngine:', global.AllemandiGachaEngine);
