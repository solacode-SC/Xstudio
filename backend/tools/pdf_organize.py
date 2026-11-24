import os
import fitz
from tools.common import sanitize_stem, save_pdf_hq


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")
    page_order = opts.get("page_order")

    with fitz.open(file_path) as doc:
        total = doc.page_count
        if total == 0:
            raise ValueError("The uploaded PDF contains 0 pages.")

        if not page_order or not isinstance(page_order, list):
            page_order = [{"page": i + 1, "rotation": 0} for i in range(total)]

        out_doc = fitz.open()
        for item in page_order:
            if isinstance(item, int):
                p_idx = item - 1
                rot = 0
            elif isinstance(item, dict):
                p_idx = int(item.get("page", 0)) - 1
                rot = int(item.get("rotation", 0))
            else:
                continue

            if 0 <= p_idx < total:
                out_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx, links=True, annots=True)
                if rot % 360 != 0:
                    new_page = out_doc[-1]
                    new_page.set_rotation((new_page.rotation + rot) % 360)

        if out_doc.page_count == 0:
            out_doc.close()
            raise ValueError("At least 1 page must remain in the organized PDF.")

        out_path = os.path.join(work_dir, f"{stem}_organized.pdf")
        save_pdf_hq(out_doc, out_path)
        out_doc.close()
        return out_path
