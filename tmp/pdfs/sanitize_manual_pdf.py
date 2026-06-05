from pathlib import Path
import subprocess
import shutil

from PIL import Image, ImageDraw
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfdoc


ROOT = Path("/Users/mac/Desktop/workspace")
INPUT_PDF = Path("/Users/mac/Desktop/智能数据网络平台v1.7.0-用户手册.pdf")
TMP_DIR = ROOT / "tmp/pdfs/manual_sanitized_pages_hq"
OUT_PDF = ROOT / "output/pdf/智能数据网络平台v1.7.0-用户手册-脱敏高清修正版.pdf"
PDFTOPPM = Path("/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pdftoppm")

DPI = 300
PAGE_W_PT = 595.3
PAGE_H_PT = 841.9
SCALE = DPI / 72.0


def rect_from_top(x1, y1, x2, y2):
    return tuple(round(v * SCALE) for v in (x1, y1, x2, y2))


# Coordinates are in PDF points measured from the top-left of the page.
COMMON_RECTS = [
    # Repeated page-header logo and company name. This intersects the header
    # rule, which is redrawn after masking.
    (72, 36, 220, 82),
]

HEADER_RULE = (72, 76.7, 430, 77.2)

PAGE_RECTS = {
    1: [
        # Large cover logo and company name.
        (74, 82, 373, 158),
    ],
}

SKIP_PAGES = {2}


def main():
    if not INPUT_PDF.exists():
        raise FileNotFoundError(INPUT_PDF)

    if TMP_DIR.exists():
        shutil.rmtree(TMP_DIR)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)

    prefix = TMP_DIR / "page"
    subprocess.run(
        [str(PDFTOPPM), "-jpeg", "-r", str(DPI), str(INPUT_PDF), str(prefix)],
        check=True,
    )

    page_paths = sorted(TMP_DIR.glob("page-*.jpg"))
    if not page_paths:
        raise RuntimeError("No rendered pages were produced")

    c = canvas.Canvas(str(OUT_PDF), pagesize=(PAGE_W_PT, PAGE_H_PT))
    c.setTitle("智能数据网络平台v1.7.0-用户手册-脱敏高清修正版")
    c._doc.info.producer = "Codex sanitized raster PDF"
    c._doc.info.creator = "Codex"
    c._doc.info.author = ""
    c._doc.info.subject = ""
    c._doc.info.keywords = ""

    for index, page_path in enumerate(page_paths, start=1):
        if index in SKIP_PAGES:
            continue

        with Image.open(page_path) as im:
            im = im.convert("RGB")
            draw = ImageDraw.Draw(im)
            for rect in COMMON_RECTS + PAGE_RECTS.get(index, []):
                draw.rectangle(rect_from_top(*rect), fill="white")
            draw.rectangle(rect_from_top(*HEADER_RULE), fill="black")
            sanitized_path = TMP_DIR / f"sanitized-{index:03d}.jpg"
            im.save(sanitized_path, "JPEG", quality=96, optimize=True)

        c.drawImage(ImageReader(str(sanitized_path)), 0, 0, width=PAGE_W_PT, height=PAGE_H_PT)
        c.showPage()

    c.save()
    print(OUT_PDF)


if __name__ == "__main__":
    main()
