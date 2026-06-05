from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas


ROOT = Path("/Users/mac/Desktop/workspace")
INPUT_PDF = Path("/Users/mac/Desktop/智能数据网络平台v1.7.0-用户手册.pdf")
OUT_PDF = ROOT / "output/pdf/智能数据网络平台v1.7.0-用户手册-脱敏清晰显示版.pdf"

PAGE_W_PT = 595.3
PAGE_H_PT = 841.9

COMMON_RECTS = [
    (72, 36, 220, 82),
]

PAGE_RECTS = {
    1: [
        (74, 82, 373, 158),
    ],
}

HEADER_RULE = (72, 76.7, 430, 77.2)
SKIP_PAGES = {2}


def add_rect_from_top(c, x1, y1, x2, y2):
    c.rect(x1, PAGE_H_PT - y2, x2 - x1, y2 - y1, stroke=0, fill=1)


def overlay_for_page(page_number):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(PAGE_W_PT, PAGE_H_PT))
    c.setFillColorRGB(1, 1, 1)
    for rect in COMMON_RECTS + PAGE_RECTS.get(page_number, []):
        add_rect_from_top(c, *rect)
    c.setFillColorRGB(0, 0, 0)
    add_rect_from_top(c, *HEADER_RULE)
    c.save()
    buf.seek(0)
    return PdfReader(buf).pages[0]


def main():
    reader = PdfReader(str(INPUT_PDF))
    writer = PdfWriter()

    for page_number, page in enumerate(reader.pages, start=1):
        if page_number in SKIP_PAGES:
            continue
        page.merge_page(overlay_for_page(page_number))
        writer.add_page(page)

    writer.add_metadata(
        {
            "/Title": "智能数据网络平台v1.7.0-用户手册-脱敏清晰显示版",
            "/Creator": "Codex",
            "/Producer": "Codex vector overlay sanitized PDF",
        }
    )

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PDF.open("wb") as f:
        writer.write(f)
    print(OUT_PDF)


if __name__ == "__main__":
    main()
