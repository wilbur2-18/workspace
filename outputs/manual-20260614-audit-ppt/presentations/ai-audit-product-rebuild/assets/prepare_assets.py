from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math
import random

SRC = Path("/Users/mac/Downloads/ChatGPT Image 2026年6月8日 14_13_17 (7).png")
OUT = Path(__file__).resolve().parent


def save_circle_crop(name, box, feather=2):
    img = Image.open(SRC).convert("RGBA")
    crop = img.crop(box)
    w, h = crop.size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    pad = feather
    draw.ellipse((pad, pad, w - pad, h - pad), fill=255)
    if feather:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    crop.putalpha(mask)
    crop.save(OUT / name)


def transparentize_light_pixels(img, strength=1.0):
    data = img.getdata()
    new = []
    for r, g, b, a in data:
        light = (r + g + b) / 3
        blue_bias = max(0, b - r)
        if light > 244 and blue_bias < 16:
            new.append((r, g, b, 0))
        elif light > 232:
            alpha = int(a * max(0.0, (255 - light) / 25) * strength)
            new.append((r, g, b, alpha))
        else:
            new.append((r, g, b, a))
    img.putdata(new)
    return img


def save_bridge():
    img = Image.open(SRC).convert("RGBA")
    crop = img.crop((492, 498, 1186, 845))
    # Remove the baked "建立桥梁" label from the illustration crop; it is added
    # back as editable text in the slide.
    mask_out = ImageDraw.Draw(crop)
    # Remove the original node labels carried by the lower illustration crop.
    # The three labels are rebuilt as editable PPT text boxes.
    for box in [(78, 0, 220, 60), (262, 0, 405, 60), (438, 0, 600, 62)]:
        mask_out.rounded_rectangle(box, radius=12, fill=(255, 255, 255, 0))
    mask_out.rounded_rectangle((245, 210, 455, 279), radius=18, fill=(255, 255, 255, 0))
    crop = transparentize_light_pixels(crop, strength=0.95)
    crop.save(OUT / "bridge-platform.png")


def save_background():
    w, h = 1280, 720
    bg = Image.new("RGB", (w, h), "#eef6ff")
    px = bg.load()
    for y in range(h):
        for x in range(w):
            nx = x / w
            ny = y / h
            glow = 1 - min(1, math.hypot(nx - 0.52, ny - 0.50) * 1.55)
            bottom = max(0, (ny - 0.58) / 0.42)
            r = int(244 - 18 * bottom - 8 * glow)
            g = int(249 - 18 * bottom - 3 * glow)
            b = int(255 - 4 * bottom)
            px[x, y] = (max(225, r), max(232, g), max(240, b))

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    random.seed(18)
    for side_x in [14, 1216]:
        for col in range(7):
            x = side_x + col * 14
            for row in range(28):
                y = 150 + row * 9 + (col % 2) * 3
                alpha = 20 + int(32 * random.random())
                draw.ellipse((x, y, x + 3, y + 3), fill=(86, 145, 255, alpha))
    for i in range(18):
        x0 = 85 + i * 62
        y0 = 642 + (i % 5) * 8
        draw.line((x0, y0, x0 + 96, y0 - 20), fill=(70, 133, 255, 22), width=1)
    for radius, alpha in [(238, 34), (305, 20), (380, 12)]:
        draw.ellipse((640 - radius, 538 - radius / 3, 640 + radius, 538 + radius / 3), outline=(55, 119, 255, alpha), width=2)
    bg = Image.alpha_composite(bg.convert("RGBA"), overlay)
    bg.save(OUT / "tech-background.png")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    save_background()
    save_bridge()
    crops = {
        "left-cube.png": (76, 433, 164, 521),
        "left-mind.png": (76, 562, 164, 650),
        "left-team.png": (76, 692, 164, 780),
        "right-doc.png": (1184, 391, 1246, 453),
        "right-network.png": (1184, 479, 1246, 541),
        "right-graph.png": (1184, 573, 1246, 635),
        "right-check.png": (1184, 668, 1246, 730),
        "right-team.png": (1184, 760, 1246, 822),
        "node-data.png": (581, 378, 697, 494),
        "node-business.png": (773, 362, 895, 484),
        "node-agent.png": (960, 382, 1077, 499),
    }
    for name, box in crops.items():
        save_circle_crop(name, box, feather=2)


if __name__ == "__main__":
    main()
