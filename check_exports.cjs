const fs = require('fs');
const path = require('path');

async function check() {
  console.log('Checking CJS...');
  try {
    const cjs = require('./dist/index.cjs');
    console.log('CJS GachaEngine:', cjs.GachaEngine ? 'exists' : 'undefined');
  } catch (e) {
    console.log('CJS error:', e.message);
  }

  console.log('\nChecking ESM...');
  try {
    const esm = await import('./dist/index.module.js');
    console.log('ESM GachaEngine:', esm.GachaEngine ? 'exists' : 'undefined');
  } catch (e) {
    console.log('ESM error:', e.message);
  }

  console.log('\nChecking UMD via require...');
  try {
    const umd = require('./dist/index.umd.js');
    console.log('UMD GachaEngine:', umd.GachaEngine ? 'exists' : 'undefined');
    console.log('UMD AllemandiGachaEngine on global:', global.AllemandiGachaEngine ? 'exists' : 'undefined');
  } catch (e) {
    console.log('UMD error:', e.message);
  }
}

check();
