from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import uuid
import os
import json
import shutil
from typing import List

router = APIRouter()

@router.post("/process")
async def process_files(
    files: List[UploadFile] = File(...),
    tool: str = Form(...),
    options: str = Form("{}")
):
    try:
        opts = json.loads(options)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid options JSON")

    for f in files:
        f.file.seek(0, 2)
        size = f.file.tell()
        f.file.seek(0)
        if size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds 50MB limit")

    req_id = str(uuid.uuid4())
    work_dir = os.path.join("./tmp", req_id)
    os.makedirs(work_dir, exist_ok=True)

    saved_files = []
    for f in files:
        path = os.path.join(work_dir, f.filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)
        saved_files.append(path)

    result_file = None
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
        else:
            raise HTTPException(status_code=400, detail=f"Unknown tool: {tool}")

        if isinstance(result_file, dict):
            return {
                "success": True,
                "type": "multi_result",
                "results": result_file
            }

        if not result_file or not os.path.exists(result_file):
            raise Exception("Processing failed to produce output")

        filename = os.path.basename(result_file)
        size_bytes = os.path.getsize(result_file)
        return {
            "success": True,
            "download_url": f"/files/{req_id}/{filename}",
            "filename": filename,
            "size_bytes": size_bytes
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(trace)
        raise HTTPException(status_code=500, detail=str(e) + " | " + trace)
