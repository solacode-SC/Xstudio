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
            if "-" in part:
                start, end = part.split("-")
                out_doc.insert_pdf(doc, from_page=int(start)-1, to_page=int(end)-1)
            else:
                out_doc.insert_pdf(doc, from_page=int(part)-1, to_page=int(part)-1)

    out_path = os.path.join(work_dir, "split_result.pdf")
    out_doc.save(out_path)
    return out_path
