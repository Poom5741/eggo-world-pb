/**
 * EggoWorld NFT Layer Generator — Replicate API (Flux)
 *
 * Run:
 *   REPLICATE_API_TOKEN=r8_xxx bun run generate_layers_replicate.js
 *   REPLICATE_API_TOKEN=r8_xxx bun run generate_layers_replicate.js --skip-existing
 *
 * Models (set via REPLICATE_MODEL env or edit the constant below):
 *   black-forest-labs/flux-schnell  → ~$0.003/img, 4 steps, fast        (default)
 *   black-forest-labs/flux-dev      → ~$0.025/img, 28 steps, sharper details
 *
 * Layer structure (matches compose_nfts.py expectations):
 *   1_Background  — 5 variants  (full scene)
 *   2_Egg         — 48 variants (8 colors × 6 expressions, combined)
 *   3_Accessory   — 10 variants (white bg → strip with rembg later)
 *
 * Total: 63 images
 *   flux-schnell : ~$0.19
 *   flux-dev     : ~$1.58
 * Combinations: 5 × 48 × 10 = 2,400 unique NFTs
 *
 * Default behavior: OVERWRITE existing layers (fresh regen).
 * Pass --skip-existing to resume an interrupted run instead.
 */

const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN environment variable is required');
  console.error('   Get a token at: https://replicate.com/account/api-tokens');
  process.exit(1);
}

const MODEL = process.env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell';
const SKIP_EXISTING = process.argv.includes('--skip-existing');
const OUT_DIR = path.join(__dirname, 'nft-layers');

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

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
// LAYER 2: Egg = Body Color × Expression (8 × 6 = 48 variants)
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

function buildInput(prompt) {
  const input = {
    prompt,
    aspect_ratio: '1:1',
    output_format: 'png',
    num_outputs: 1,
    disable_safety_checker: false,
  };

  if (MODEL.includes('flux-schnell')) {
    // schnell: 1-4 steps, no guidance scale
    input.num_inference_steps = 4;
    input.go_fast = true;
  } else if (MODEL.includes('flux-dev')) {
    input.num_inference_steps = 28;
    input.guidance = 3.5;
  } else if (MODEL.includes('flux-1.1-pro') || MODEL.includes('flux-pro')) {
    // flux-pro: uses different param names
    input.steps = 28;
    input.guidance = 3.0;
  }

  return input;
}

async function fetchToBuffer(output) {
  // Replicate may return: array of strings (URLs), array of FileOutput objects,
  // a single FileOutput, or a single URL string.
  const first = Array.isArray(output) ? output[0] : output;

  if (!first) throw new Error('Empty output from Replicate');

  if (typeof first === 'string') {
    const res = await fetch(first);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  // FileOutput-like object (Replicate SDK >=1.0 returns these)
  if (typeof first.blob === 'function') {
    const blob = await first.blob();
    return Buffer.from(await blob.arrayBuffer());
  }

  if (typeof first.url === 'function') {
    const url = first.url();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  if (first instanceof Uint8Array) {
    return Buffer.from(first);
  }

  throw new Error(`Unexpected Replicate output type: ${typeof first}`);
}

async function generateOne(folder, name, prompt, retries = 3) {
  const dir = path.join(OUT_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${name}.png`);

  if (SKIP_EXISTING && fs.existsSync(outPath)) {
    console.log(`  ⏭  Skip [${folder}/${name}] (exists)`);
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      process.stdout.write(`  ⏳ [${folder}/${name}]${attempt > 1 ? ` (retry ${attempt})` : ''}... `);
      const output = await replicate.run(MODEL, { input: buildInput(prompt) });
      const buffer = await fetchToBuffer(output);
      if (!buffer || buffer.length < 500) throw new Error('Empty/invalid response');
      fs.writeFileSync(outPath, buffer);
      console.log(`✅ ${(buffer.length / 1024).toFixed(0)}KB`);
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
    const results = await Promise.all(batch.map(j => generateOne(j.folder, j.name, j.prompt)));
    done += results.filter(Boolean).length;
    failed += results.filter(r => !r).length;
    console.log(`  ── ${done + failed}/${jobs.length} processed\n`);
  }
  return { done, failed };
}

async function main() {
  const allJobs = [
    ...BACKGROUNDS.map(v  => ({ folder: '1_Background', name: v.name, prompt: v.prompt })),
    ...EGGS.map(v         => ({ folder: '2_Egg',        name: v.name, prompt: v.prompt })),
    ...ACCESSORIES.map(v  => ({ folder: '3_Accessory',  name: v.name, prompt: v.prompt })),
  ];

  const existing = allJobs.filter(j => fs.existsSync(path.join(OUT_DIR, j.folder, `${j.name}.png`))).length;
  const todo = SKIP_EXISTING ? allJobs.length - existing : allJobs.length;

  // Cost estimate per model
  const costPer = MODEL.includes('schnell') ? 0.003
                : MODEL.includes('flux-dev') ? 0.025
                : MODEL.includes('flux-1.1-pro') ? 0.04
                : 0.01;

  console.log('═══════════════════════════════════════════════════');
  console.log('   EggoWorld NFT Layer Generator — Replicate');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Model       : ${MODEL}`);
  console.log(`   Mode        : ${SKIP_EXISTING ? 'skip-existing (resume)' : 'overwrite (fresh)'}`);
  console.log(`   Backgrounds : ${BACKGROUNDS.length}`);
  console.log(`   Eggs        : ${EGGS.length} (${EGG_COLORS.length} colors × ${EGG_EXPRESSIONS.length} expressions)`);
  console.log(`   Accessories : ${ACCESSORIES.length}`);
  console.log(`   Total       : ${allJobs.length} images`);
  console.log(`   Already done: ${existing}`);
  console.log(`   To generate : ${todo}`);
  console.log(`   Est. cost   : ~$${(todo * costPer).toFixed(2)}`);
  console.log(`   NFT combos  : ${BACKGROUNDS.length} × ${EGGS.length} × ${ACCESSORIES.length} = ${BACKGROUNDS.length * EGGS.length * ACCESSORIES.length} unique NFTs`);
  console.log(`   Output      : ${OUT_DIR}`);
  console.log('═══════════════════════════════════════════════════\n');

  const startedAt = Date.now();

  console.log('── Phase 1: Backgrounds ──');
  await runBatch(allJobs.filter(j => j.folder === '1_Background'));

  console.log('── Phase 2: Eggs (color × expression) ──');
  await runBatch(allJobs.filter(j => j.folder === '2_Egg'));

  console.log('── Phase 3: Accessories ──');
  await runBatch(allJobs.filter(j => j.folder === '3_Accessory'));

  const mins = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);

  console.log('═══════════════════════════════════════════════════');
  console.log(`  ✅ Generation complete in ${mins} min`);
  console.log('  Next:');
  console.log('    1. Run rembg on 3_Accessory to strip white bg');
  console.log('    2. Run compose_nfts.py (or HashLips) to mint 2,400 NFTs');
  console.log('═══════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
