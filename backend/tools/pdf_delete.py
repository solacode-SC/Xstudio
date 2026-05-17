import fitz
import os

async def run(files, opts, work_dir):
    file_path = files[0]
    pages_to_delete = opts.get("pages", "")
    doc = fitz.open(file_path)
    
    if pages_to_delete:
        pages = [int(p.strip()) - 1 for p in pages_to_delete.split(",") if p.strip().isdigit()]
        pages.sort(reverse=True)
        for p in pages:
            if 0 <= p < doc.page_count:
                doc.delete_page(p)
                
    out_path = os.path.join(work_dir, "deleted_result.pdf")
    doc.save(out_path)
    return out_path
