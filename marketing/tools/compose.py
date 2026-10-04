"""Builds marketing/ from raw simulator screenshots.

    compose.py <raw> <out>                       landing images + widget cut-outs
    compose.py <raw> <out> --locales en,es,...   captioned App Store sets per language
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

RAW, OUT = sys.argv[1], sys.argv[2]
SF = "/System/Library/Fonts/SFNS.ttf"
JA_BOLD = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
JA_REGULAR = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"
SFR = "/System/Library/Fonts/SFNSRounded.ttf"
W, H = 1320, 2868  # 6.9" App Store size (iPhone 17 Pro Max)

def font(size, weight=700, path=SF, lang="en"):
    if lang == "ja":  # SF has no Japanese glyphs
        return ImageFont.truetype(JA_BOLD if weight >= 600 else JA_REGULAR, int(size * 0.92))
    f = ImageFont.truetype(path, size)
    # Axes: width, optical size, grade, weight.
    f.set_variation_by_axes([100, min(96, max(17, size / 3)), 400, weight])
    return f

def rounded(im, r):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0]-1, im.size[1]-1], r, fill=255)
    out = im.convert("RGBA"); out.putalpha(mask); return out

def gradient(size, top, bottom):
    w, h = size
    t = np.linspace(0, 1, h)[:, None, None]
    arr = (np.array(top)[None, None, :] * (1 - t) + np.array(bottom)[None, None, :] * t)
    return Image.fromarray(np.repeat(arr, w, axis=1).astype("uint8"))

def wrap(draw, text, f, width):
    if " " not in text.strip():  # Japanese: break between characters
        lines, line = [], ""
        for ch in text:
            if draw.textlength(line + ch, font=f) <= width: line += ch
            else: lines.append(line); line = ch
        lines.append(line); return lines
    words, lines, line = text.split(), [], ""
    for w_ in words:
        test = (line + " " + w_).strip()
        if draw.textlength(test, font=f) <= width: line = test
        else: lines.append(line); line = w_
    lines.append(line); return lines

THEMES = {
    "dark":  dict(top=(22, 20, 40), bottom=(10, 10, 14), title=(242, 242, 244), sub=(170, 170, 182), accent=(139, 138, 248)),
    "light": dict(top=(236, 233, 252), bottom=(247, 245, 250), title=(14, 12, 17), sub=(91, 89, 96), accent=(91, 76, 240)),
}

def frame(shot, title, subtitle, theme, out, lang="en", raw=None):
    t = THEMES[theme]
    canvas = gradient((W, H), t["top"], t["bottom"]).convert("RGBA")
    d = ImageDraw.Draw(canvas)
    tf, sf = font(112, 720, lang=lang), font(48, 450, lang=lang)
    y = 170
    for line in wrap(d, title, tf, W - 160):
        d.text((W/2, y), line, font=tf, fill=t["title"], anchor="ma"); y += 122
    y += 22
    for line in wrap(d, subtitle, sf, W - 220):
        d.text((W/2, y), line, font=sf, fill=t["sub"], anchor="ma"); y += 62
    # Phone screenshot: rounded like the device, with a soft shadow.
    scale = 0.80
    img = Image.open(os.path.join(raw or RAW, shot)).convert("RGB")
    sw, sh = int(img.width * scale), int(img.height * scale)
    phone = rounded(img.resize((sw, sh), Image.LANCZOS), 118)
    bezel = rounded(Image.new("RGB", (sw + 28, sh + 28), (18, 18, 22) if theme == "dark" else (30, 30, 34)), 132)
    px, py = (W - bezel.width) // 2, max(y + 70, 690)
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([px, py + 30, px + bezel.width, py + bezel.height + 30], 132,
                                             fill=(0, 0, 0, 120 if theme == "dark" else 70))
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(40)))
    canvas.alpha_composite(bezel, (px, py))
    canvas.alpha_composite(phone, (px + 14, py + 14))
    # JPEG at high quality: App Store Connect accepts it and it is ~5x smaller than PNG.
    canvas.convert("RGB").save(out.replace(".png", ".jpg"), "JPEG", quality=92, optimize=True, progressive=True)

def cutouts(shot, theme, out_dir, card, labels):
    """Finds widget tiles (card-coloured blocks on the gradient) and saves each with rounded corners."""
    img = Image.open(os.path.join(RAW, shot)).convert("RGB")
    a = np.asarray(img).astype(int)
    mask = (np.abs(a - np.array(card)).sum(axis=2) < 24)
    rows = np.where(mask.mean(axis=1) > 0.08)[0]
    # Split into horizontal bands of tile rows.
    bands, start = [], rows[0]
    for i in range(1, len(rows)):
        if rows[i] - rows[i-1] > 6: bands.append((start, rows[i-1])); start = rows[i]
    bands.append((start, rows[-1]))
    n = 0
    for top, bottom in bands:
        if bottom - top < 150: continue
        cols = np.where(mask[top:bottom].mean(axis=0) > 0.2)[0]
        segs, s0 = [], cols[0]
        for i in range(1, len(cols)):
            if cols[i] - cols[i-1] > 6: segs.append((s0, cols[i-1])); s0 = cols[i]
        segs.append((s0, cols[-1]))
        for left, right in segs:
            if right - left < 150: continue
            tile = img.crop((left, top, right + 1, bottom + 1))
            rounded(tile, 66).save(os.path.join(out_dir, f"{labels[n]}-{theme}.png"), optimize=True)
            n += 1
    return n

def main():
    """Landing images and widget cut-outs. App Store sets: see localized()."""
    landing, widgets = (os.path.join(OUT, p) for p in ("landing", "widgets"))
    for p in (landing, widgets): os.makedirs(p, exist_ok=True)

    # Landing page: unframed screenshots in both appearances, as web-size
    # PNG (660px) and full-resolution WebP for retina.
    for f in sorted(os.listdir(RAW)):
        if not f.endswith(".png") or f.startswith("home_free") and "dark" in f: continue
        im = Image.open(os.path.join(RAW, f)).convert("RGB")
        rounded(im.resize((660, 1434), Image.LANCZOS), 60).save(os.path.join(landing, f), optimize=True)
        rounded(im, 120).save(os.path.join(landing, f.replace(".png", ".webp")), "WEBP", quality=88, method=6)

    for theme, card in (("dark", (29, 29, 32)), ("light", (255, 255, 255))):
        names = [["small-calories", "small-steps", "medium-exercise", "large-sleep-months"],
                 ["medium-overview", "medium-steps", "small-stand", "small-floors", "medium-calories"]]
        for shot, labels in zip((f"widgets_{theme}.png", f"widgets2_{theme}.png"), names):
            cutouts(shot, theme, widgets, card, labels)


def localized(locales):
    import json
    captions = json.load(open(os.path.join(os.path.dirname(__file__), "captions.json")))
    for loc in locales:
        raw = os.path.join(RAW, "en" if loc == "ja" else loc)
        out = os.path.join(OUT, "app-store/iphone-6.9", loc)
        os.makedirs(out, exist_ok=True)
        for i, (slide, (title, sub)) in enumerate(zip(captions["slides"], captions[loc]), 1):
            theme = "light" if slide.endswith("light") else "dark"
            frame(f"{slide}.png", title, sub, theme, os.path.join(out, f"{i:02d}-{slide}.png"), lang=loc, raw=raw)
        print(loc, "done")

if len(sys.argv) > 3 and sys.argv[3] == "--locales":
    localized(sys.argv[4].split(","))
else:
    main()
