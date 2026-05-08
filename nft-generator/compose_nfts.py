#!/usr/bin/env python3
"""
EggoWorld NFT Composer
Composes all 2,400 unique NFTs from 63 layer images.

Layer structure:
  nft-layers/1_Background/  — 5 variants  (RGB, full scene)
  nft-layers/2_Egg/         — 48 variants (RGBA, transparent bg)
  nft-layers/3_Accessory/   — 10 variants (RGBA, transparent bg)

Output:
  nft-output/images/1.png … 2400.png
  nft-output/metadata/1.json … 2400.json
  nft-output/_metadata.json   (full collection)

Usage:
  python3 compose_nfts.py                    # full 2,400 run
  python3 compose_nfts.py --limit 5          # test: first 5 only
  python3 compose_nfts.py --start 101        # resume from #101
  python3 compose_nfts.py --shuffle          # randomise order
"""

import argparse
import json
import os
import random
import sys
from itertools import product
from pathlib import Path
from PIL import Image

# ── Paths ────────────────────────────────────────────────────────────────────
HERE       = Path(__file__).parent
LAYERS_DIR = HERE.parent / 'nft-layers'
OUT_DIR    = HERE.parent / 'nft-output'
IMG_DIR    = OUT_DIR / 'images'
META_DIR   = OUT_DIR / 'metadata'

# ── Collection metadata ───────────────────────────────────────────────────────
COLLECTION_NAME        = 'EggoWorld'
COLLECTION_DESCRIPTION = (
    'EggoWorld is a gamified NFT collection on BNB SmartChain. '
    'Each Egg is a unique 8-bit character ready for adventure. '
    'Collect, hatch, and earn through the EggoWorld ecosystem.'
)
BASE_URI    = 'ipfs://YOUR_CID_HERE'   # update after IPFS upload
ROYALTY_BPS = 500                       # 5% royalty

# ── Rarity weights (higher = more common) ────────────────────────────────────
# Background weights
BG_WEIGHTS = {
    'Forest':  30,
    'Ocean':   25,
    'Space':   15,
    'Sunset':  20,
    'Dungeon': 10,
}

# Egg color weights
EGG_COLOR_WEIGHTS = {
    'Golden': 8,   # rare
    'Blue':   15,
    'Red':    15,
    'Purple': 12,
    'Green':  15,
    'Pink':   15,
    'Black':  10,  # uncommon
    'White':  10,  # uncommon
}

# Expression weights
EGG_EXPR_WEIGHTS = {
    'Happy':     25,
    'Angry':     15,
    'Sleepy':    15,
    'Winking':   20,
    'Surprised': 15,
    'Cool':      10,
}

# Accessory weights
ACC_WEIGHTS = {
    'None':     35,  # most NFTs have no accessory
    'Cap':      12,
    'Glasses':  10,
    'Bow':      8,
    'Headband': 8,
    'Crown':    7,   # uncommon
    'Mohawk':   7,
    'Halo':     6,
    'Top_Hat':  5,
    'Helmet':   2,   # rare
}


def load_layer_images(folder: Path) -> dict[str, Path]:
    """Returns {name: path} for all PNGs in a layer folder."""
    return {p.stem: p for p in sorted(folder.glob('*.png'))}


def weighted_combinations(
    backgrounds: dict,
    eggs: dict,
    accessories: dict,
    total: int,
    seed: int = 42,
) -> list[tuple[str, str, str]]:
    """
    Generate `total` (bg, egg, acc) combos sampled according to
    the rarity weights defined above. Duplicates are allowed so that
    rarer traits appear less frequently across the collection.
    """
    rng = random.Random(seed)

    bg_names   = list(backgrounds.keys())
    egg_names  = list(eggs.keys())        # e.g. "Golden_Happy"
    acc_names  = list(accessories.keys())

    def egg_weight(name: str) -> float:
        color, expr = name.split('_', 1)
        return EGG_COLOR_WEIGHTS.get(color, 10) * EGG_EXPR_WEIGHTS.get(expr, 10)

    bg_w   = [BG_WEIGHTS.get(n, 10)  for n in bg_names]
    egg_w  = [egg_weight(n)           for n in egg_names]
    acc_w  = [ACC_WEIGHTS.get(n, 10)  for n in acc_names]

    combos = []
    seen   = set()
    max_unique = len(bg_names) * len(egg_names) * len(acc_names)  # 2,400
    attempts   = 0
    max_tries  = total * 20

    while len(combos) < total and attempts < max_tries:
        attempts += 1
        bg  = rng.choices(bg_names,  weights=bg_w)[0]
        egg = rng.choices(egg_names, weights=egg_w)[0]
        acc = rng.choices(acc_names, weights=acc_w)[0]
        key = (bg, egg, acc)
        if key not in seen:
            seen.add(key)
            combos.append(key)

    if len(combos) < total:
        # Fallback: fill remaining with unseen combos in order
        all_combos = list(product(bg_names, egg_names, acc_names))
        rng.shuffle(all_combos)
        for combo in all_combos:
            if combo not in seen and len(combos) < total:
                seen.add(combo)
                combos.append(combo)

    return combos


def exhaustive_combinations(
    backgrounds: dict,
    eggs: dict,
    accessories: dict,
    shuffle: bool = False,
    seed: int = 42,
) -> list[tuple[str, str, str]]:
    """All 2,400 unique combinations (5×48×10), optionally shuffled."""
    combos = list(product(backgrounds.keys(), eggs.keys(), accessories.keys()))
    if shuffle:
        random.Random(seed).shuffle(combos)
    return combos


def compose(bg_path: Path, egg_path: Path, acc_path: Path, size: int = 1024) -> Image.Image:
    """Stack layers: background → egg → accessory."""
    canvas = Image.open(bg_path).convert('RGBA').resize((size, size), Image.LANCZOS)
    egg    = Image.open(egg_path).convert('RGBA').resize((size, size), Image.LANCZOS)
    acc    = Image.open(acc_path).convert('RGBA').resize((size, size), Image.LANCZOS)
    canvas.paste(egg, (0, 0), egg)
    canvas.paste(acc, (0, 0), acc)
    return canvas.convert('RGB')  # final NFT is RGB JPEG-friendly


def build_metadata(token_id: int, bg: str, egg: str, acc: str) -> dict:
    color, expression = egg.split('_', 1)
    rarity_score = (
        (100 - BG_WEIGHTS.get(bg, 10)) +
        (100 - EGG_COLOR_WEIGHTS.get(color, 10) * 2) +
        (100 - EGG_EXPR_WEIGHTS.get(expression, 10) * 2) +
        (100 - ACC_WEIGHTS.get(acc, 10) * 2)
    )
    return {
        'name':        f'EggoWorld #{token_id}',
        'description': COLLECTION_DESCRIPTION,
        'image':       f'{BASE_URI}/{token_id}.png',
        'edition':     token_id,
        'attributes': [
            {'trait_type': 'Background',  'value': bg},
            {'trait_type': 'Egg Color',   'value': color},
            {'trait_type': 'Expression',  'value': expression},
            {'trait_type': 'Accessory',   'value': acc if acc != 'None' else 'No Accessory'},
        ],
        'compiler': 'EggoWorld NFT Composer v1.0',
    }


def main():
    parser = argparse.ArgumentParser(description='EggoWorld NFT Composer')
    parser.add_argument('--layers', default=str(LAYERS_DIR), help='Layers root directory')
    parser.add_argument('--out',    default=str(OUT_DIR),    help='Output directory')
    parser.add_argument('--size',   type=int, default=1024,  help='Output image size (px)')
    parser.add_argument('--limit',  type=int, default=0,     help='Only generate N NFTs (0 = all)')
    parser.add_argument('--start',  type=int, default=1,     help='Start token ID (resume support)')
    parser.add_argument('--shuffle',action='store_true',     help='Shuffle combination order')
    parser.add_argument('--seed',   type=int, default=42,    help='Random seed')
    args = parser.parse_args()

    layers_dir = Path(args.layers)
    out_dir    = Path(args.out)
    img_dir    = out_dir / 'images'
    meta_dir   = out_dir / 'metadata'

    img_dir.mkdir(parents=True, exist_ok=True)
    meta_dir.mkdir(parents=True, exist_ok=True)

    # Load layers
    bgs  = load_layer_images(layers_dir / '1_Background')
    eggs = load_layer_images(layers_dir / '2_Egg')
    accs = load_layer_images(layers_dir / '3_Accessory')

    print('═' * 55)
    print('   EggoWorld NFT Composer')
    print('═' * 55)
    print(f'   Backgrounds : {len(bgs)}')
    print(f'   Eggs        : {len(eggs)}')
    print(f'   Accessories : {len(accs)}')
    print(f'   Max unique  : {len(bgs) * len(eggs) * len(accs):,}')

    combos = exhaustive_combinations(bgs, eggs, accs, shuffle=args.shuffle, seed=args.seed)

    if args.limit:
        combos = combos[:args.limit]

    total     = len(combos)
    start_idx = args.start - 1  # 0-based index into combos list

    pending = combos[start_idx:]
    print(f'   Generating  : {len(pending):,} NFTs (#{args.start} → #{args.start + len(pending) - 1})')
    print(f'   Output      : {out_dir}')
    print('═' * 55 + '\n')

    done = 0
    all_meta = []

    for i, (bg, egg, acc) in enumerate(pending):
        token_id  = args.start + i
        img_path  = img_dir  / f'{token_id}.png'
        meta_path = meta_dir / f'{token_id}.json'

        # Resume support
        if img_path.exists() and meta_path.exists():
            print(f'  ⏭  Skip #{token_id}')
            with open(meta_path) as f:
                all_meta.append(json.load(f))
            done += 1
            continue

        try:
            img = compose(bgs[bg], eggs[egg], accs[acc], size=args.size)
            img.save(img_path, 'PNG', optimize=True)

            meta = build_metadata(token_id, bg, egg, acc)
            with open(meta_path, 'w') as f:
                json.dump(meta, f, indent=2)

            all_meta.append(meta)
            done += 1

            if done % 100 == 0 or done <= 10:
                print(f'  ✅ #{token_id:4d}  bg={bg:<8} egg={egg:<20} acc={acc}')
            elif done % 50 == 0:
                print(f'  ... {done}/{len(pending)} done')

        except Exception as e:
            print(f'  ❌ #{token_id} FAILED: {e}', file=sys.stderr)

    # Write combined _metadata.json
    collection_meta_path = out_dir / '_metadata.json'
    with open(collection_meta_path, 'w') as f:
        json.dump(all_meta, f, indent=2)

    print(f'\n{"═" * 55}')
    print(f'  ✅ Done: {done}/{len(pending)} NFTs composed')
    print(f'  📁 Images   : {img_dir}')
    print(f'  📄 Metadata : {meta_dir}')
    print(f'  📋 Combined : {collection_meta_path}')
    print(f'\n  Next steps:')
    print(f'  1. Review sample images in nft-output/images/')
    print(f'  2. Update BASE_URI in this script after IPFS upload')
    print(f'  3. Upload nft-output/ to Pinata/nft.storage')
    print('═' * 55)


if __name__ == '__main__':
    main()
