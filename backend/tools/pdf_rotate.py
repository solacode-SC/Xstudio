import fitz
import os
import json

async def run(files, opts, work_dir):
    file_path = files[0]
    
    rotations_opt = opts.get("rotations", "{}")
    if isinstance(rotations_opt, str):
        rotations = json.loads(rotations_opt)
    else:
        rotations = rotations_opt
        
    doc = fitz.open(file_path)
    for i, page in enumerate(doc):
        page_num = str(i + 1)
        if page_num in rotations:
            page.set_rotation(page.rotation + rotations[page_num])
    
    out_path = os.path.join(work_dir, "rotated_result.pdf")
    doc.save(out_path)
    return out_path
