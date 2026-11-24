import os
import asyncio
import fitz
from docx import Document
from docx.shared import Pt
from tools.common import sanitize_stem, parse_page_spec


def _convert_with_layout(file_path: str, out_path: str, pages_list: list[int] | None):
    try:
        from pdf2docx import Converter

        cv = Converter(file_path)
        try:
            if pages_list is not None:
                cv.convert(out_path, pages=pages_list)
            else:
                cv.convert(out_path)
        finally:
            cv.close()

        if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            return out_path
    except Exception as e:
        print(f"pdf2docx layout engine fallback triggered: {e}")

    # Rich structured block/span fallback via PyMuPDF
    word_doc = Document()
    with fitz.open(file_path) as doc:
        target_pages = pages_list if pages_list is not None else list(range(doc.page_count))
        for idx, pno in enumerate(target_pages):
            page = doc.load_page(pno)
            page_dict = page.get_text("dict")
            for block in page_dict.get("blocks", []):
                if block.get("type") != 0:
                    continue
                para = word_doc.add_paragraph()
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        txt = span.get("text", "")
                        if not txt:
                            continue
                        run = para.add_run(txt)
                        size = span.get("size", 11)
                        run.font.size = Pt(max(8, min(36, round(size))))
                        flags = span.get("flags", 0)
                        if flags & 16:
                            run.bold = True
                        if flags & 2:
                            run.italic = True
                    para.add_run(" ")
            if idx < len(target_pages) - 1:
                word_doc.add_page_break()

    word_doc.save(out_path)
    return out_path


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")
    pages_spec = (opts.get("pages") or "").strip()

    with fitz.open(file_path) as doc:
        total = doc.page_count
        if total == 0:
            raise ValueError("The uploaded PDF contains 0 pages.")

        pages_list = None
        if pages_spec:
            pages_list = parse_page_spec(pages_spec, total, deduplicate=True)
            if not pages_list:
                raise ValueError(f"No valid pages matched '{pages_spec}' (document has {total} pages).")

    out_path = os.path.join(work_dir, f"{stem}.docx")
    return await asyncio.to_thread(_convert_with_layout, file_path, out_path, pages_list)
