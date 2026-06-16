from pathlib import Path

from PIL import Image


base = Path(__file__).resolve().parent
im = Image.open(base / "icon-sheet-alpha.png").convert("RGBA")
width, height = im.size
names = [
    "workstation",
    "robot-execution",
    "center-monitor",
    "database",
    "knowledge-book",
    "ai-head",
    "graph-relation",
    "audit-check",
    "ai-brain-head",
    "skill-layers",
    "app-lightning",
    "audit-tool",
]

cols = 4
rows = 3
pad = 18
paths = []

for idx, name in enumerate(names):
    col = idx % cols
    row = idx // cols
    crop = im.crop(
        (
            int(col * width / cols),
            int(row * height / rows),
            int((col + 1) * width / cols),
            int((row + 1) * height / rows),
        )
    )
    bbox = crop.getchannel("A").getbbox()
    if not bbox:
        continue
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(crop.size[0], x1 + pad)
    y1 = min(crop.size[1], y1 + pad)
    canvas = crop.crop((x0, y0, x1, y1))
    out = base / f"{idx + 1:02d}-{name}.png"
    canvas.save(out)
    paths.append(out)

print("\n".join(str(path) for path in paths))
