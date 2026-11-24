import os
import zipfile
import fitz
from tools.common import sanitize_stem, parse_page_spec, save_pdf_hq


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")
    pages_spec = (opts.get("pages") or "").strip()
    separate_files = bool(opts.get("separate_files", False))

    with fitz.open(file_path) as doc:
        total = doc.page_count
        if total == 0:
            raise ValueError("The uploaded PDF contains 0 pages.")

        if pages_spec:
            selected = parse_page_spec(pages_spec, total, deduplicate=False)
            if not selected:
                raise ValueError(f"No valid pages matched '{pages_spec}' (document has {total} pages).")
        else:
            selected = list(range(total))

        if separate_files and len(selected) > 1:
            parts_dir = os.path.join(work_dir, "extracted_pages")
            os.makedirs(parts_dir, exist_ok=True)
            zip_path = os.path.join(work_dir, f"{stem}_extracted_{len(selected)}_pages.zip")
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
                for idx, p in enumerate(selected, start=1):
                    single = fitz.open()
                    single.insert_pdf(doc, from_page=p, to_page=p, links=True, annots=True)
                    part_name = f"{stem}_{idx:02d}_page_{p + 1}.pdf"
                    part_path = os.path.join(parts_dir, part_name)
                    save_pdf_hq(single, part_path)
                    single.close()
                    zipf.write(part_path, part_name)
            return zip_path

        out_doc = fitz.open()
        for p in selected:
            out_doc.insert_pdf(doc, from_page=p, to_page=p, links=True, annots=True)

        out_path = os.path.join(work_dir, f"{stem}_extracted.pdf")
        save_pdf_hq(out_doc, out_path)
        out_doc.close()
        return out_path
