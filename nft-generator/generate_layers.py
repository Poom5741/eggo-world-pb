#!/usr/bin/env python3
"""
EggoWorld NFT Layer Generator — ComfyUI Edition
Generates all NFT layer components in parallel across both GPUs.
Output is HashLips-compatible folder structure with transparent PNGs.

Usage:
    python3 generate_layers.py --comfy-url https://xxxx.trycloudflare.com
    python3 generate_layers.py --comfy-url http://localhost:8188
"""

import argparse
import json
import time
import urllib.request
import urllib.error
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

# ─────────────────────────────────────────────
# LAYER DEFINITIONS
# Each entry: (trait_name, prompt_suffix)
# The BASE_STYLE is prepended to all prompts
# ─────────────────────────────────────────────
BASE_STYLE = (
    "8-bit pixel art, retro game asset, white background, "
    "centered composition, no shadow, pixelated, clean edges, "
    "game NFT character, vibrant colors"
)

LAYERS = {
    "1_background": [
        ("forest",    "lush green pixel art forest background, trees, 8-bit style"),
        ("ocean",     "pixel art ocean background, blue waves, 8-bit style"),
        ("space",     "pixel art space background, stars, galaxy, 8-bit style"),
        ("sunset",    "pixel art sunset background, orange sky, 8-bit style"),
        ("dungeon",   "pixel art dungeon background, stone walls, 8-bit style"),
    ],
    "2_egg_body": [
        ("golden",   f"golden shiny egg character, gold color, {BASE_STYLE}"),
        ("blue",     f"blue egg character, vibrant blue, {BASE_STYLE}"),
        ("red",      f"red egg character, bright red, {BASE_STYLE}"),
        ("purple",   f"purple egg character, violet color, {BASE_STYLE}"),
        ("green",    f"green egg character, bright green, {BASE_STYLE}"),
        ("pink",     f"pink egg character, hot pink color, {BASE_STYLE}"),
        ("black",    f"black egg character, dark color with shine, {BASE_STYLE}"),
        ("white",    f"white pearl egg character, bright white, {BASE_STYLE}"),
    ],
    "3_expression": [
        ("happy",     f"egg character with big happy smile, joyful face, {BASE_STYLE}"),
        ("angry",     f"egg character with angry frown, fierce face, {BASE_STYLE}"),
        ("sleepy",    f"egg character with sleepy eyes, drowsy face, {BASE_STYLE}"),
        ("winking",   f"egg character winking one eye, playful face, {BASE_STYLE}"),
        ("surprised", f"egg character with surprised wide eyes, shocked face, {BASE_STYLE}"),
        ("cool",      f"egg character with cool expression, confident face, {BASE_STYLE}"),
    ],
    "4_accessory": [
        ("crown",     f"golden pixel art crown on egg, royal accessory, {BASE_STYLE}"),
        ("top_hat",   f"pixel art top hat on egg, fancy hat, {BASE_STYLE}"),
        ("glasses",   f"pixel art sunglasses on egg, cool shades, {BASE_STYLE}"),
        ("headband",  f"pixel art headband on egg, sporty, {BASE_STYLE}"),
        ("bow",       f"pixel art bow on egg, cute ribbon, {BASE_STYLE}"),
        ("helmet",    f"pixel art knight helmet on egg, armored, {BASE_STYLE}"),
        ("halo",      f"pixel art golden halo above egg, angel, {BASE_STYLE}"),
        ("cap",       f"pixel art baseball cap on egg, casual, {BASE_STYLE}"),
        ("mohawk",    f"pixel art mohawk hairstyle on egg, punk, {BASE_STYLE}"),
        ("none",      f"plain egg character, no accessory, {BASE_STYLE}"),
    ],
}

# ComfyUI workflow template for txt2img with transparent background
# Uses RemBG node to remove background → transparent PNG
WORKFLOW_TEMPLATE = {
    "3": {
        "inputs": {
            "seed": 42,
            "steps": 20,
            "cfg": 7.5,
            "sampler_name": "euler_ancestral",
            "scheduler": "normal",
            "denoise": 1.0,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
    },
    "4": {
        "inputs": {"ckpt_name": "pixelartxl.safetensors"},
        "class_type": "CheckpointLoaderSimple"
    },
    "5": {
        "inputs": {"width": 1024, "height": 1024, "batch_size": 1},
        "class_type": "EmptyLatentImage"
    },
    "6": {
        "inputs": {"text": "PROMPT_PLACEHOLDER", "clip": ["4", 1]},
        "class_type": "CLIPTextEncode"
    },
    "7": {
        "inputs": {
            "text": "blurry, low quality, watermark, text, ugly, deformed, extra limbs, photo, realistic",
            "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
    },
    "8": {
        "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        "class_type": "VAEDecode"
    },
    "9": {
        "inputs": {"images": ["8", 0]},
        "class_type": "PreviewImage"
    },
    "10": {
        "inputs": {"image": ["8", 0]},
        "class_type": "Image Remove Background (rembg)"
    },
    "11": {
        "inputs": {
            "filename_prefix": "OUTPUT_PREFIX",
            "images": ["10", 0]
        },
        "class_type": "SaveImage"
    }
}


def build_workflow(prompt: str, output_prefix: str, seed: int, model: str) -> dict:
    wf = json.loads(json.dumps(WORKFLOW_TEMPLATE))
    wf["6"]["inputs"]["text"] = prompt
    wf["11"]["inputs"]["filename_prefix"] = output_prefix
    wf["3"]["inputs"]["seed"] = seed
    wf["4"]["inputs"]["ckpt_name"] = model
    return wf


def submit_job(comfy_url: str, workflow: dict) -> str:
    payload = json.dumps({"prompt": workflow}).encode()
    req = urllib.request.Request(
        f"{comfy_url}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode())
    return result["prompt_id"]


def poll_job(comfy_url: str, prompt_id: str, timeout: int = 300) -> dict:
    start = time.time()
    while time.time() - start < timeout:
        time.sleep(3)
        req = urllib.request.Request(f"{comfy_url}/history/{prompt_id}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            history = json.loads(resp.read().decode())
        if prompt_id in history:
            return history[prompt_id]
    raise TimeoutError(f"Job {prompt_id} timed out after {timeout}s")


def download_output(comfy_url: str, job_result: dict, out_path: str):
    outputs = job_result.get("outputs", {})
    for node_id, node_output in outputs.items():
        images = node_output.get("images", [])
        for img in images:
            filename = img["filename"]
            subfolder = img.get("subfolder", "")
            img_url = f"{comfy_url}/view?filename={filename}&subfolder={subfolder}&type=output"
            req = urllib.request.Request(img_url)
            with urllib.request.urlopen(req, timeout=30) as r:
                with open(out_path, "wb") as f:
                    f.write(r.read())
            return  # Save first image found


def generate_one(comfy_url: str, layer: str, name: str, prompt: str,
                 out_dir: str, model: str, seed: int):
    prefix = f"eggo_{layer}_{name}"
    workflow = build_workflow(prompt, prefix, seed, model)
    prompt_id = submit_job(comfy_url, workflow)
    print(f"  ⏳ Submitted [{layer}/{name}] → {prompt_id[:16]}...")
    result = poll_job(comfy_url, prompt_id)
    out_path = os.path.join(out_dir, layer, f"{name}.png")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    download_output(comfy_url, result, out_path)
    print(f"  ✓ [{layer}/{name}] saved → {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="EggoWorld NFT Layer Generator")
    parser.add_argument("--comfy-url", default="http://localhost:8188", help="ComfyUI server URL")
    parser.add_argument("--out-dir", default="./nft-layers", help="Output directory")
    parser.add_argument("--model", default="pixelartxl.safetensors", help="Checkpoint filename")
    parser.add_argument("--workers", type=int, default=2, help="Parallel workers (match GPU count)")
    parser.add_argument("--seed", type=int, default=42, help="Base seed (increments per image)")
    parser.add_argument("--layer", default=None, help="Generate only this layer (e.g. 2_egg_body)")
    args = parser.parse_args()

    comfy_url = args.comfy_url.rstrip("/")

    # Health check
    try:
        req = urllib.request.Request(f"{comfy_url}/system_stats")
        with urllib.request.urlopen(req, timeout=10) as resp:
            stats = json.loads(resp.read().decode())
        gpus = stats.get("devices", [])
        print(f"✅ ComfyUI connected — {len(gpus)} GPU(s) detected")
        for g in gpus:
            print(f"   {g.get('name')} — {g.get('vram_total', 0)//1024//1024}MB VRAM")
    except Exception as e:
        print(f"❌ Cannot reach ComfyUI at {comfy_url}: {e}")
        sys.exit(1)

    # Build job list
    jobs = []
    seed = args.seed
    layers_to_run = {args.layer: LAYERS[args.layer]} if args.layer and args.layer in LAYERS else LAYERS
    for layer, variants in layers_to_run.items():
        for name, prompt in variants:
            jobs.append((layer, name, prompt, seed))
            seed += 1

    total = len(jobs)
    print(f"\n🎨 Generating {total} layer images with {args.workers} parallel workers...\n")

    done = 0
    failed = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(generate_one, comfy_url, layer, name, prompt,
                            args.out_dir, args.model, s): (layer, name)
            for layer, name, prompt, s in jobs
        }
        for future in as_completed(futures):
            layer, name = futures[future]
            try:
                future.result()
                done += 1
                print(f"  Progress: {done}/{total}")
            except Exception as e:
                failed.append(f"{layer}/{name}")
                print(f"  ✗ [{layer}/{name}] ERROR: {e}")

    print(f"\n{'='*50}")
    print(f"✅ Done: {done}/{total} images generated")
    if failed:
        print(f"❌ Failed: {', '.join(failed)}")
    print(f"📁 Output: {os.path.abspath(args.out_dir)}")
    print(f"\nNext step: point HashLips at {os.path.abspath(args.out_dir)}")


if __name__ == "__main__":
    main()
