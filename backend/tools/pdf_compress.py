import fitz
import os

async def run(files, opts, work_dir):
    file_path = files[0]
    quality = opts.get("quality", "medium")
    
    doc = fitz.open(file_path)
    out_path = os.path.join(work_dir, "compressed_result.pdf")
    
    garbage = 3
    if quality == "low":
        garbage = 4
    elif quality == "high":
        garbage = 2
        
    doc.save(out_path, deflate=True, garbage=garbage)
    return out_path
