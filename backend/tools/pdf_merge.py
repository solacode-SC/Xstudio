import os
import fitz
from tools.common import sanitize_stem, save_pdf_hq

A4_PORTRAIT = (595.28, 841.89)
A4_LANDSCAPE = (841.89, 595.28)


async def run(files, opts, work_dir):
    if len(files) < 1:
        raise ValueError("Please upload PDF files to merge.")

    add_bookmarks = bool(opts.get("add_bookmarks", True))
    normalize_a4 = bool(opts.get("normalize_a4", False))

    out_doc = fitz.open()
    toc = []

    for file_path in files:
        with fitz.open(file_path) as src:
            if src.page_count == 0:
                continue

            start_page_1based = out_doc.page_count + 1
            doc_title = os.path.splitext(os.path.basename(file_path))[0]

            if normalize_a4:
                for pno in range(src.page_count):
                    src_page = src[pno]
                    rect = src_page.rect
                    target_w, target_h = A4_LANDSCAPE if rect.width > rect.height else A4_PORTRAIT
                    new_page = out_doc.new_page(width=target_w, height=target_h)

                    scale = min(target_w / rect.width, target_h / rect.height)
                    draw_w = rect.width * scale
                    draw_h = rect.height * scale
                    x0 = (target_w - draw_w) / 2
                    y0 = (target_h - draw_h) / 2
                    target_rect = fitz.Rect(x0, y0, x0 + draw_w, y0 + draw_h)
                    new_page.show_pdf_page(target_rect, src, pno)
            else:
                out_doc.insert_pdf(src, links=True, annots=True)

            if add_bookmarks:
                toc.append([1, doc_title, start_page_1based])
                for item in src.get_toc(simple=True):
                    lvl, title, page_num = item[0], item[1], item[2]
                    if 1 <= page_num <= src.page_count:
                        toc.append([lvl + 1, title, start_page_1based + page_num - 1])

    if out_doc.page_count == 0:
        out_doc.close()
        raise ValueError("None of the uploaded PDFs contained pages.")

    if add_bookmarks and toc:
        try:
            out_doc.set_toc(toc)
        except Exception:
            pass

    stem = sanitize_stem(files[0], "merged")
    out_name = f"{stem}_merged_{len(files)}_files.pdf" if len(files) > 1 else f"{stem}_merged.pdf"
    out_path = os.path.join(work_dir, out_name)
    save_pdf_hq(out_doc, out_path)
    out_doc.close()
    return out_path
