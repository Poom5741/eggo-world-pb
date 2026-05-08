#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Set bundle size threshold as 200KB (in bytes)
const KB = 1024;
const BUDGET_THRESHOLD = 200 * KB; // 200KB budget

// Define the build output path
const BUILD_OUTPUT_PATH = './out/_next/static/chunks';

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function checkMainBundleSize(outputPath) {
  let mainBundleSize = 0;
  
  if (fs.existsSync(outputPath)) {
    const files = fs.readdirSync(outputPath);
    for (const file of files) {
      if (file.endsWith('.js') && !file.includes('polyfill') && !file.includes('framework') && !file.startsWith('_')) {
        const filePath = path.join(outputPath, file);
        const stat = fs.statSync(filePath);
        mainBundleSize += stat.size;
      }
    }
  }
  
  return mainBundleSize;
}

function main() {
  console.log('🔍 Checking bundle size...\n');
  
  const mainBundleSize = checkMainBundleSize(BUILD_OUTPUT_PATH);
  
  console.log(`📦 Main bundle size: ${formatBytes(mainBundleSize)}`);
  console.log(`📊 Budget: ${formatBytes(BUDGET_THRESHOLD)}\n`);
  
  if (mainBundleSize > BUDGET_THRESHOLD) {
    const overBudget = mainBundleSize - BUDGET_THRESHOLD;
    console.log(`❌ BUNDLE SIZE EXCEEDED!`);
    console.log(`❌ Over budget by: ${formatBytes(overBudget)}`);
    console.log(`❌ Size: ${formatBytes(mainBundleSize)} > ${formatBytes(BUDGET_THRESHOLD)}`);
    process.exit(1);
  } else {
    const leftUnderBudget = BUDGET_THRESHOLD - mainBundleSize;
    console.log(`✅ Bundle size within budget!`);
    console.log(`✅ Left under budget: ${formatBytes(leftUnderBudget)}`);
    console.log(`✅ Size: ${formatBytes(mainBundleSize)} < ${formatBytes(BUDGET_THRESHOLD)}`);
  }
}

// Run the check
main();