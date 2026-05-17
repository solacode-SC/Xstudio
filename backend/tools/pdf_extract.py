import fitz
import os

async def run(files, opts, work_dir):
    file_path = files[0]
    pages_to_extract = opts.get("pages", "")
    doc = fitz.open(file_path)
    out_doc = fitz.open()
    
    if pages_to_extract:
        pages = [int(p.strip()) - 1 for p in pages_to_extract.split(",") if p.strip().isdigit()]
        for p in pages:
            if 0 <= p < doc.page_count:
                out_doc.insert_pdf(doc, from_page=p, to_page=p)
    else:
        out_doc.insert_pdf(doc)
                
    out_path = os.path.join(work_dir, "extracted_result.pdf")
    out_doc.save(out_path)
    return out_path
