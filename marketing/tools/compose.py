"""Builds marketing/ from raw simulator screenshots: App Store frames,
landing-page images and cut-out widgets."""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

RAW, OUT = sys.argv[1], sys.argv[2]
SF = "/System/Library/Fonts/SFNS.ttf"
SFR = "/System/Library/Fonts/SFNSRounded.ttf"
W, H = 1320, 2868  # 6.9" App Store size (iPhone 17 Pro Max)

def font(size, weight=700, path=SF):
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

def frame(shot, title, subtitle, theme, out):
    t = THEMES[theme]
    canvas = gradient((W, H), t["top"], t["bottom"]).convert("RGBA")
    d = ImageDraw.Draw(canvas)
    tf, sf = font(112, 720), font(48, 450)
    y = 170
    for line in wrap(d, title, tf, W - 160):
        d.text((W/2, y), line, font=tf, fill=t["title"], anchor="ma"); y += 122
    y += 22
    for line in wrap(d, subtitle, sf, W - 220):
        d.text((W/2, y), line, font=sf, fill=t["sub"], anchor="ma"); y += 62
    # Phone screenshot: rounded like the device, with a soft shadow.
    scale = 0.80
    img = Image.open(os.path.join(RAW, shot)).convert("RGB")
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
    canvas.convert("RGB").save(out, optimize=True)

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
    store, landing, widgets = (os.path.join(OUT, p) for p in ("app-store/iphone-6.9", "landing", "widgets"))
    for p in (store, landing, widgets): os.makedirs(p, exist_ok=True)

    shots = [
        ("home_weeks_dark.png", "Every day, one square", "Your Apple Health data as a wall of truth.", "dark"),
        ("config_dark.png", "Your ranges, your colors", "Set four thresholds so good days and great days look different.", "dark"),
        ("home_months_light.png", "Month by month", "Switch to the month view and spot your patterns.", "light"),
        ("detail_steps_dark.png", "Streaks and history", "Every day you hit your goal, in one calendar.", "dark"),
        ("widgets_dark.png", "Your wall, everywhere", "Widgets for every metric on your Home Screen.", "dark"),
        ("home_weeks_all_dark.png", "Six metrics, one wall", "Calories, steps, exercise, stand hours, floors and sleep.", "dark"),
        # Optional last slide: the free tier. Leave it out for an all-unlocked set.
        ("home_free_light.png", "Start free with calories", "Unlock steps, exercise, stand, floors and sleep once. No subscription.", "light"),
    ]
    for i, (shot, title, sub, theme) in enumerate(shots, 1):
        frame(shot, title, sub, theme, os.path.join(store, f"{i:02d}-{shot.replace('.png', '')}.png"))

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


main()
