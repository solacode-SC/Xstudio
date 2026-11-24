import os
import uuid
import json
import shutil
import traceback
from typing import List
import fitz
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from tools.common import get_pdf_page_count

router = APIRouter()

MAX_FILE_SIZE_MB = 100
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def safe_upload_filename(name: str, index: int) -> str:
    base = os.path.basename(name or f"upload_{index + 1}")
    base = base.replace("\x00", "").strip()
    return base if base else f"upload_{index + 1}"


@router.post("/process")
async def process_files(
    files: List[UploadFile] = File(...),
    tool: str = Form(...),
    options: str = Form("{}"),
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one file.")

    try:
        opts = json.loads(options) if options else {}
        if not isinstance(opts, dict):
            opts = {}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid configuration payload.")

    total_input_bytes = 0
    for f in files:
        f.file.seek(0, 2)
        size = f.file.tell()
        f.file.seek(0)
        if size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"'{f.filename}' exceeds the {MAX_FILE_SIZE_MB}MB per-file limit.",
            )
        total_input_bytes += size

    req_id = str(uuid.uuid4())
    work_dir = os.path.join("./tmp", req_id)
    os.makedirs(work_dir, exist_ok=True)

    saved_files: List[str] = []
    used_names = set()
    for idx, f in enumerate(files):
        fname = safe_upload_filename(f.filename or f"file_{idx + 1}", idx)
        if fname in used_names:
            stem, ext = os.path.splitext(fname)
            fname = f"{stem}_{idx + 1}{ext}"
        used_names.add(fname)

        input_dir = os.path.join(work_dir, "inputs")
        os.makedirs(input_dir, exist_ok=True)
        path = os.path.join(input_dir, fname)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)
        saved_files.append(path)

    # Check encrypted PDFs early (except for protect/unlock tool which handles passwords itself)
    if tool not in ("protect", "images_to_pdf"):
        for p in saved_files:
            if p.lower().endswith(".pdf"):
                try:
                    with fitz.open(p) as doc:
                        if doc.needs_pass:
                            raise HTTPException(
                                status_code=400,
                                detail=f"'{os.path.basename(p)}' is password-protected. Unlock it first using Protect / Unlock PDF.",
                            )
                except HTTPException:
                    raise
                except Exception:
                    raise HTTPException(
                        status_code=400,
                        detail=f"'{os.path.basename(p)}' could not be read as a valid PDF document.",
                    )

    try:
        if tool == "split":
            from tools import pdf_split
            result_file = await pdf_split.run(saved_files, opts, work_dir)
        elif tool == "merge":
            from tools import pdf_merge
            result_file = await pdf_merge.run(saved_files, opts, work_dir)
        elif tool == "compress":
            from tools import pdf_compress
            result_file = await pdf_compress.run(saved_files, opts, work_dir)
        elif tool == "rotate":
            from tools import pdf_rotate
            result_file = await pdf_rotate.run(saved_files, opts, work_dir)
        elif tool == "delete":
            from tools import pdf_delete
            result_file = await pdf_delete.run(saved_files, opts, work_dir)
        elif tool == "extract":
            from tools import pdf_extract
            result_file = await pdf_extract.run(saved_files, opts, work_dir)
        elif tool == "pdf_to_images":
            from tools import pdf_to_images
            result_file = await pdf_to_images.run(saved_files, opts, work_dir)
        elif tool == "images_to_pdf":
            from tools import images_to_pdf
            result_file = await images_to_pdf.run(saved_files, opts, work_dir)
        elif tool == "pdf_to_word":
            from tools import pdf_to_word
            result_file = await pdf_to_word.run(saved_files, opts, work_dir)
        elif tool == "organize":
            from tools import pdf_organize
            result_file = await pdf_organize.run(saved_files, opts, work_dir)
        elif tool == "watermark":
            from tools import pdf_watermark
            result_file = await pdf_watermark.run(saved_files, opts, work_dir)
        elif tool == "protect":
            from tools import pdf_protect
            result_file = await pdf_protect.run(saved_files, opts, work_dir)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown Studio tool: {tool}")

        if isinstance(result_file, dict):
            return {
                "success": True,
                "type": "multi_result",
                "original_size_bytes": total_input_bytes,
                **result_file,
            }

        if not result_file or not os.path.exists(result_file):
            raise HTTPException(status_code=500, detail="Engine did not produce an output artifact.")

        rel_path = os.path.relpath(result_file, work_dir).replace("\\", "/")
        filename = os.path.basename(result_file)
        size_bytes = os.path.getsize(result_file)
        page_count = get_pdf_page_count(result_file)

        return {
            "success": True,
            "download_url": f"/files/{req_id}/{rel_path}",
            "filename": filename,
            "size_bytes": size_bytes,
            "original_size_bytes": total_input_bytes,
            "page_count": page_count,
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
