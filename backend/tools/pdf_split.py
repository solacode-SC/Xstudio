import fitz
import os

async def run(files, opts, work_dir):
    file_path = files[0]
    ranges = opts.get("ranges", "")
    
    doc = fitz.open(file_path)
    out_doc = fitz.open()

    if not ranges:
        out_doc.insert_pdf(doc)
    else:
        parts = ranges.split(",")
        for part in parts:
            part = part.strip()
            if not part: continue
            if "-" in part:
                try:
                    start, end = part.split("-")
                    s = max(0, int(start.strip()) - 1)
                    e = min(doc.page_count - 1, int(end.strip()) - 1)
                    if s <= e:
                        out_doc.insert_pdf(doc, from_page=s, to_page=e)
                except ValueError:
                    pass
            else:
                try:
                    p = int(part) - 1
                    if 0 <= p < doc.page_count:
                        out_doc.insert_pdf(doc, from_page=p, to_page=p)
                except ValueError:
                    pass

    out_path = os.path.join(work_dir, "split_result.pdf")
    out_doc.save(out_path)
    return out_path
