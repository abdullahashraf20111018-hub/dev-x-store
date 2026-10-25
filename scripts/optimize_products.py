"""Convert 4K product PNGs to web WebP: card (900px) + thumb (320px).
usage: python3 scripts/optimize_products.py <src_dir_with_png> <dst_dir>"""
import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.lower().endswith(".png"): continue
    im = Image.open(os.path.join(src, f)).convert("RGB"); base = f[:-4]
    for suffix, size, q in (("", 900, 80), ("_thumb", 320, 78)):
        im.resize((size, size), Image.LANCZOS).save(os.path.join(dst, base + suffix + ".webp"), "WEBP", quality=q, method=6)
    print(base)
