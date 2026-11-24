import os
import io
import asyncio
import fitz
from PIL import Image, ImageOps
from tools.common import sanitize_stem, save_pdf_hq

PAGE_SIZES_PT = {
    "a4": (595.28, 841.89),
    "letter": (612.0, 792.0),
}

MARGIN_PT = {
    "none": 0.0,
    "small": 28.35,   # ~10mm
    "medium": 42.52,  # ~15mm
    "large": 56.70,   # ~20mm
}


def _build_pdf_from_images(files, opts, work_dir):
    page_size = str(opts.get("page_size") or "a4").lower()      # a4 | letter | fit
    orientation = str(opts.get("orientation") or "auto").lower() # auto | portrait | landscape
    margin_key = str(opts.get("margin") or "small").lower()
    target_dpi = int(opts.get("dpi") or 300)

    out_doc = fitz.open()

    for file_path in files:
        with Image.open(file_path) as raw_img:
            img = ImageOps.exif_transpose(raw_img)
            src_format = (raw_img.format or "").upper()

            # Composite alpha cleanly onto white studio canvas
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                rgba = img.convert("RGBA")
                white = Image.new("RGB", rgba.size, (255, 255, 255))
                white.paste(rgba, mask=rgba.split()[3])
                rgb_img = white
            elif img.mode != "RGB":
                rgb_img = img.convert("RGB")
            else:
                rgb_img = img.copy()

            img_w, img_h = rgb_img.size
            if img_w == 0 or img_h == 0:
                continue

            if page_size == "fit":
                # Exact native proportions at 300 DPI (or actual image DPI) without borders
                page_w = (img_w / target_dpi) * 72.0
                page_h = (img_h / target_dpi) * 72.0
                # Clamp extreme point sizes to standard viewer range while keeping exact aspect ratio
                if max(page_w, page_h) < 200:
                    factor = 595.28 / max(page_w, page_h)
                    page_w *= factor
                    page_h *= factor
                draw_rect = fitz.Rect(0, 0, page_w, page_h)
            else:
                base_w, base_h = PAGE_SIZES_PT.get(page_size, PAGE_SIZES_PT["a4"])
                if orientation == "landscape" or (orientation == "auto" and img_w > img_h):
                    page_w, page_h = max(base_w, base_h), min(base_w, base_h)
                else:
                    page_w, page_h = min(base_w, base_h), max(base_w, base_h)

                pad = MARGIN_PT.get(margin_key, 28.35)
                avail_w = max(72.0, page_w - 2 * pad)
                avail_h = max(72.0, page_h - 2 * pad)

                scale = min(avail_w / img_w, avail_h / img_h)
                draw_w = img_w * scale
                draw_h = img_h * scale
                x0 = (page_w - draw_w) / 2.0
                y0 = (page_h - draw_h) / 2.0
                draw_rect = fitz.Rect(x0, y0, x0 + draw_w, y0 + draw_h)

                # Downsample gently with Lanczos ONLY if image wildly exceeds target print DPI on page
                max_needed_px_w = int((draw_w / 72.0) * target_dpi * 1.2)
                max_needed_px_h = int((draw_h / 72.0) * target_dpi * 1.2)
                if img_w > max_needed_px_w * 1.25 and max_needed_px_w > 0 and max_needed_px_h > 0:
                    rgb_img = rgb_img.resize((max_needed_px_w, max_needed_px_h), Image.Resampling.LANCZOS)

            buf = io.BytesIO()
            if src_format == "PNG":
                rgb_img.save(buf, format="PNG", optimize=True)
            else:
                rgb_img.save(buf, format="JPEG", quality=95, subsampling=0, optimize=True)
            stream_bytes = buf.getvalue()

            page = out_doc.new_page(width=page_w, height=page_h)
            page.insert_image(draw_rect, stream=stream_bytes)

    if out_doc.page_count == 0:
        out_doc.close()
        raise ValueError("No valid images were uploaded.")

    stem = sanitize_stem(files[0], "gallery")
    out_name = f"{stem}_studio.pdf" if len(files) == 1 else f"{stem}_{len(files)}_images.pdf"
    out_path = os.path.join(work_dir, out_name)
    save_pdf_hq(out_doc, out_path)
    out_doc.close()
    return out_path


async def run(files, opts, work_dir):
    return await asyncio.to_thread(_build_pdf_from_images, files, opts, work_dir)
