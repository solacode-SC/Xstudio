import os
import fitz
from tools.common import sanitize_stem, save_pdf_hq

COLORS = {
    "gray": (0.35, 0.35, 0.38),
    "black": (0.07, 0.07, 0.09),
    "red": (0.82, 0.12, 0.15),
    "blue": (0.10, 0.32, 0.78),
}


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")

    text = str(opts.get("text") or "").strip()
    position = str(opts.get("position") or "diagonal")  # diagonal | header | footer | center
    opacity = max(0.05, min(0.85, float(opts.get("opacity") or 0.18)))
    font_size = max(14, min(110, int(opts.get("font_size") or 52)))
    color_key = str(opts.get("color") or "gray").lower()
    rgb = COLORS.get(color_key, COLORS["gray"])

    add_page_numbers = bool(opts.get("page_numbers", False))
    num_pos = str(opts.get("number_position") or "bottom-right")  # bottom-right | bottom-center | top-right
    num_fmt = str(opts.get("number_format") or "page_of")         # page_of | slash | simple
    start_num = max(1, int(opts.get("start_number") or 1))

    if not text and not add_page_numbers:
        raise ValueError("Enable watermark text, page numbering, or both before processing.")

    with fitz.open(file_path) as doc:
        total = doc.page_count
        font = fitz.Font("helv")

        for idx, page in enumerate(doc):
            rect = page.rect
            cx, cy = rect.width / 2.0, rect.height / 2.0

            if text:
                tw = font.text_length(text, fontsize=font_size)
                if position == "diagonal":
                    writer = fitz.TextWriter(rect)
                    writer.append(fitz.Point(cx - tw / 2.0, cy + font_size / 3.0), text, font=font, fontsize=font_size)
                    writer.write_text(
                        page,
                        color=rgb,
                        opacity=opacity,
                        morph=(fitz.Point(cx, cy), fitz.Matrix(1, 0, 0, 1, 0, 0).prerotate(45)),
                        overlay=True,
                    )
                elif position == "center":
                    writer = fitz.TextWriter(rect)
                    writer.append(fitz.Point(cx - tw / 2.0, cy + font_size / 3.0), text, font=font, fontsize=font_size)
                    writer.write_text(page, color=rgb, opacity=opacity, overlay=True)
                elif position == "header":
                    hdr_size = min(font_size, 18)
                    hw = font.text_length(text, fontsize=hdr_size)
                    writer = fitz.TextWriter(rect)
                    writer.append(fitz.Point(cx - hw / 2.0, 32), text, font=font, fontsize=hdr_size)
                    writer.write_text(page, color=rgb, opacity=min(0.85, opacity * 2), overlay=True)
                elif position == "footer":
                    ftr_size = min(font_size, 18)
                    fw = font.text_length(text, fontsize=ftr_size)
                    writer = fitz.TextWriter(rect)
                    writer.append(fitz.Point(cx - fw / 2.0, rect.height - 24), text, font=font, fontsize=ftr_size)
                    writer.write_text(page, color=rgb, opacity=min(0.85, opacity * 2), overlay=True)

            if add_page_numbers:
                cur = start_num + idx
                end_total = start_num + total - 1
                if num_fmt == "slash":
                    label = f"{cur} / {end_total}"
                elif num_fmt == "simple":
                    label = f"{cur}"
                else:
                    label = f"Page {cur} of {end_total}"

                nsize = 10.0
                nw = font.text_length(label, fontsize=nsize)
                if num_pos == "bottom-center":
                    pt = fitz.Point(cx - nw / 2.0, rect.height - 22)
                elif num_pos == "top-right":
                    pt = fitz.Point(rect.width - nw - 32, 28)
                else:
                    pt = fitz.Point(rect.width - nw - 32, rect.height - 22)

                num_writer = fitz.TextWriter(rect)
                num_writer.append(pt, label, font=font, fontsize=nsize)
                num_writer.write_text(page, color=(0.22, 0.22, 0.25), opacity=0.85, overlay=True)

        out_path = os.path.join(work_dir, f"{stem}_stamped.pdf")
        save_pdf_hq(doc, out_path)
        return out_path
