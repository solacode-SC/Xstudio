import os
import json
import fitz
from tools.common import sanitize_stem, save_pdf_hq


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")

    rotations_opt = opts.get("rotations", {})
    if isinstance(rotations_opt, str):
        try:
            rotations = json.loads(rotations_opt)
        except Exception:
            rotations = {}
    elif isinstance(rotations_opt, dict):
        rotations = rotations_opt
    else:
        rotations = {}

    global_angle = int(opts.get("global_angle") or 0)
    target = opts.get("target", "all")  # all | even | odd | landscape | portrait

    with fitz.open(file_path) as doc:
        for i, page in enumerate(doc):
            page_num_1 = i + 1
            delta = 0

            if global_angle != 0:
                rect = page.rect
                if target == "all":
                    delta += global_angle
                elif target == "even" and page_num_1 % 2 == 0:
                    delta += global_angle
                elif target == "odd" and page_num_1 % 2 == 1:
                    delta += global_angle
                elif target == "landscape" and rect.width > rect.height:
                    delta += global_angle
                elif target == "portrait" and rect.height >= rect.width:
                    delta += global_angle

            custom_deg = rotations.get(str(page_num_1), rotations.get(page_num_1, 0))
            if custom_deg:
                delta += int(custom_deg)

            if delta % 360 != 0:
                page.set_rotation((page.rotation + delta) % 360)

        out_path = os.path.join(work_dir, f"{stem}_rotated.pdf")
        save_pdf_hq(doc, out_path)
        return out_path
