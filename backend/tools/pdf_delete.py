import fitz
import os

async def run(files, opts, work_dir):
    file_path = files[0]
    pages_to_delete = opts.get("pages", "")
    doc = fitz.open(file_path)
    
    if pages_to_delete:
        pages = set()
        parts = pages_to_delete.split(",")
        for part in parts:
            part = part.strip()
            if not part: continue
            if "-" in part:
                try:
                    start, end = part.split("-")
                    s = max(0, int(start.strip()) - 1)
                    e = min(doc.page_count - 1, int(end.strip()) - 1)
                    for i in range(s, e + 1):
                        pages.add(i)
                except ValueError:
                    pass
            else:
                try:
                    p = int(part) - 1
                    if 0 <= p < doc.page_count:
                        pages.add(p)
                except ValueError:
                    pass
                    
        sorted_pages = sorted(list(pages), reverse=True)
        for p in sorted_pages:
            if 0 <= p < doc.page_count:
                doc.delete_page(p)
                
    out_path = os.path.join(work_dir, "deleted_result.pdf")
    doc.save(out_path)
    return out_path
