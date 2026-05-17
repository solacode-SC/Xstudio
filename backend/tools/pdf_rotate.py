import fitz
import os

async def run(files, opts, work_dir):
    file_path = files[0]
    angle = int(opts.get("angle", 90))
    doc = fitz.open(file_path)
    for page in doc:
        page.set_rotation(page.rotation + angle)
    
    out_path = os.path.join(work_dir, "rotated_result.pdf")
    doc.save(out_path)
    return out_path
