import os
import fitz
from tools.common import sanitize_stem, parse_page_spec, save_pdf_hq


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")
    pages_spec = (opts.get("pages") or "").strip()

    with fitz.open(file_path) as doc:
        total = doc.page_count
        if not pages_spec:
            raise ValueError("Select at least one page to delete by clicking pages or typing ranges.")

        to_delete = sorted(set(parse_page_spec(pages_spec, total, deduplicate=True)), reverse=True)
        if not to_delete:
            raise ValueError(f"No valid page numbers found in '{pages_spec}' (document has {total} pages).")

        if len(to_delete) >= total:
            raise ValueError("Cannot delete every page in the PDF — at least 1 page must remain.")

        for p in to_delete:
            doc.delete_page(p)

        out_path = os.path.join(work_dir, f"{stem}_cleaned.pdf")
        save_pdf_hq(doc, out_path)
        return out_path
