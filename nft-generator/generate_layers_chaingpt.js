/**
 * EggoWorld NFT Layer Generator — ChainGPT API
 * Run: node generate_layers_chaingpt.js
 *
 * Layer structure:
 *   1_Background  — 5 variants  (full scene)
 *   2_Egg         — 48 variants (body color + expression combined)
 *   3_Accessory   — 10 variants (item only, white bg → rembg strips it)
 *
 * Total: 63 images @ $0.01 = ~$0.63
 * Combinations: 5 × 48 × 10 = 2,400 unique NFTs
 */

const { Nft } = require('@chaingpt/nft');
const fs = require('fs');
const path = require('path');

const API_KEY = 'a9161d04-c670-41c0-b6b0-2818c2dc083a';
const OUT_DIR = path.join(__dirname, '..', 'nft-layers');
const nft = new Nft({ apiKey: API_KEY });

const BASE = '8-bit pixel art, retro game NFT asset, solid white background, centered, no shadow, pixelated, clean pixel edges, vibrant colors';

// ─────────────────────────────────────────────
// LAYER 1: Backgrounds (5 variants)
// ─────────────────────────────────────────────
const BACKGROUNDS = [
  { name: 'Forest',  prompt: '8-bit pixel art lush green forest background, pixel trees and bushes, retro game scenery, no characters' },
  { name: 'Ocean',   prompt: '8-bit pixel art ocean beach background, blue waves, sandy shore, pixel clouds, retro game scenery, no characters' },
  { name: 'Space',   prompt: '8-bit pixel art outer space background, stars planets galaxy, dark sky, retro game scenery, no characters' },
  { name: 'Sunset',  prompt: '8-bit pixel art sunset background, orange pink purple sky, pixel clouds, retro game scenery, no characters' },
  { name: 'Dungeon', prompt: '8-bit pixel art dungeon background, stone brick walls, pixel torches on walls, dark atmosphere, retro game scenery, no characters' },
];

// ─────────────────────────────────────────────
// LAYER 2: Egg = Body Color × Expression (8×6 = 48 variants)
// ─────────────────────────────────────────────
const EGG_COLORS = [
  { color: 'Golden', desc: 'golden shiny bright gold colored' },
  { color: 'Blue',   desc: 'vibrant royal blue colored' },
  { color: 'Red',    desc: 'bright crimson red colored' },
  { color: 'Purple', desc: 'vibrant violet purple colored' },
  { color: 'Green',  desc: 'bright emerald green colored' },
  { color: 'Pink',   desc: 'hot pink colored' },
  { color: 'Black',  desc: 'dark obsidian black shiny colored' },
  { color: 'White',  desc: 'bright pearl white glowing colored' },
];

const EGG_EXPRESSIONS = [
  { expr: 'Happy',     face: 'big happy smile, joyful sparkling eyes' },
  { expr: 'Angry',     face: 'angry frown, fierce thick eyebrows, grumpy look' },
  { expr: 'Sleepy',    face: 'half-closed drowsy sleepy eyes, tired expression' },
  { expr: 'Winking',   face: 'winking one eye, playful smirk' },
  { expr: 'Surprised', face: 'wide shocked surprised eyes, open mouth' },
  { expr: 'Cool',      face: 'cool confident smug expression, slight smile' },
];

// Generate all 48 combinations
const EGGS = [];
for (const c of EGG_COLORS) {
  for (const e of EGG_EXPRESSIONS) {
    EGGS.push({
      name: `${c.color}_${e.expr}`,
      prompt: `${c.desc} egg character with ${e.face}, cute egg NFT character, ${BASE}`,
    });
  }
}

// ─────────────────────────────────────────────
// LAYER 3: Accessories (10 variants, white bg)
// rembg will strip white bg to transparent after generation
// ─────────────────────────────────────────────
const ACCESSORIES = [
  { name: 'Crown',    prompt: `golden pixel art crown floating centered, royal accessory item only, no egg body, ${BASE}` },
  { name: 'Top_Hat',  prompt: `black pixel art top hat centered, elegant accessory item only, no egg body, ${BASE}` },
  { name: 'Glasses',  prompt: `pixel art cool sunglasses centered, stylish accessory item only, no egg body, ${BASE}` },
  { name: 'Headband', prompt: `colorful pixel art sports headband centered, accessory item only, no egg body, ${BASE}` },
  { name: 'Bow',      prompt: `cute pink pixel art bow ribbon centered, adorable accessory item only, no egg body, ${BASE}` },
  { name: 'Helmet',   prompt: `pixel art knight helmet centered, medieval accessory item only, no egg body, ${BASE}` },
  { name: 'Halo',     prompt: `glowing golden pixel art halo ring centered, angelic accessory item only, no egg body, ${BASE}` },
  { name: 'Cap',      prompt: `pixel art baseball cap centered, casual accessory item only, no egg body, ${BASE}` },
  { name: 'Mohawk',   prompt: `colorful pixel art mohawk hair centered, punk accessory item only, no egg body, ${BASE}` },
  { name: 'None',     prompt: `completely empty white background, nothing, blank` },
];

// ─────────────────────────────────────────────
// GENERATOR LOGIC
// ─────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generateOne(folder, name, prompt, model, size, steps, retries = 3) {
  const dir = path.join(OUT_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${name}.png`);

  if (fs.existsSync(outPath)) {
    console.log(`  ⏭  Skip [${folder}/${name}]`);
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      process.stdout.write(`  ⏳ [${folder}/${name}]${attempt > 1 ? ` (retry ${attempt})` : ''}... `);
      const result = await nft.generateImage({ prompt, model, enhance: 'original', steps, height: size, width: size });
      const imgData = result?.data?.data;
      if (!imgData || imgData.length < 500) throw new Error('Empty/invalid response');
      fs.writeFileSync(outPath, Buffer.from(imgData));
      console.log(`✅ ${(imgData.length / 1024).toFixed(0)}KB`);
      return true;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      if (attempt < retries) await sleep(4000);
    }
  }
  console.error(`  ✗ Gave up [${folder}/${name}]`);
  return false;
}

async function runBatch(jobs, batchSize = 3) {
  let done = 0, failed = 0;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(j => generateOne(j.folder, j.name, j.prompt, j.model, j.size, j.steps)));
    done += results.filter(Boolean).length;
    failed += results.filter(r => !r).length;
    console.log(`  ── ${done + failed}/${jobs.length} processed\n`);
  }
  return { done, failed };
}

async function main() {
  const allJobs = [
    ...BACKGROUNDS.map(v => ({ folder: '1_Background', name: v.name, prompt: v.prompt, model: 'nebula_forge_xl', size: 1024, steps: 25 })),
    ...EGGS.map(v =>        ({ folder: '2_Egg',        name: v.name, prompt: v.prompt, model: 'nebula_forge_xl', size: 1024, steps: 25 })),
    ...ACCESSORIES.map(v => ({ folder: '3_Accessory',  name: v.name, prompt: v.prompt, model: 'nebula_forge_xl', size: 1024, steps: 25 })),
  ];

  const already = allJobs.filter(j => fs.existsSync(path.join(OUT_DIR, j.folder, `${j.name}.png`))).length;
  const todo = allJobs.length - already;

  console.log('═══════════════════════════════════════════════════');
  console.log('   EggoWorld NFT Layer Generator — ChainGPT API');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Backgrounds : ${BACKGROUNDS.length}`);
  console.log(`   Eggs        : ${EGGS.length} (${EGG_COLORS.length} colors × ${EGG_EXPRESSIONS.length} expressions)`);
  console.log(`   Accessories : ${ACCESSORIES.length}`);
  console.log(`   Total       : ${allJobs.length} images`);
  console.log(`   Skipping    : ${already} already done`);
  console.log(`   Generating  : ${todo} remaining`);
  console.log(`   Est. cost   : ~$${(todo * 0.01).toFixed(2)}`);
  console.log(`   NFT combos  : ${BACKGROUNDS.length} × ${EGGS.length} × ${ACCESSORIES.length} = ${BACKGROUNDS.length * EGGS.length * ACCESSORIES.length} unique NFTs`);
  console.log(`   Output      : ${OUT_DIR}`);
  console.log('═══════════════════════════════════════════════════\n');

  console.log('── Phase 1: Backgrounds ──');
  await runBatch(allJobs.filter(j => j.folder === '1_Background'));

  console.log('── Phase 2: Eggs (body + expression) ──');
  await runBatch(allJobs.filter(j => j.folder === '2_Egg'));

  console.log('── Phase 3: Accessories ──');
  await runBatch(allJobs.filter(j => j.folder === '3_Accessory'));

  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ Generation complete!');
  console.log('  Next: run rembg on 3_Accessory to strip white bg');
  console.log('  Then: run HashLips to compose your 2,400 NFTs');
  console.log('═══════════════════════════════════════════════════');
}

main().catch(console.error);
