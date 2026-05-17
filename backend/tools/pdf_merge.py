import fitz
import os

async def run(files, opts, work_dir):
    out_doc = fitz.open()
    for file_path in files:
        doc = fitz.open(file_path)
        out_doc.insert_pdf(doc)

    out_path = os.path.join(work_dir, "merged_result.pdf")
    out_doc.save(out_path)
    return out_path
