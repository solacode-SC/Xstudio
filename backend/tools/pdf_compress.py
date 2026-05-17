import fitz
import os
import asyncio

async def compress_gs(input_file, output_file, quality_preset):
    cmd = [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={quality_preset}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_file}",
        input_file
    ]
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
    except Exception:
        pass
    
    if not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
        doc = fitz.open(input_file)
        doc.save(output_file, deflate=True, garbage=4)
        doc.close()

async def run(files, opts, work_dir):
    file_path = files[0]
    req_id = os.path.basename(work_dir)
    
    out_low = os.path.join(work_dir, "compressed_low.pdf")
    out_med = os.path.join(work_dir, "compressed_medium.pdf")
    out_high = os.path.join(work_dir, "compressed_high.pdf")
    
    await asyncio.gather(
        compress_gs(file_path, out_low, "/screen"),
        compress_gs(file_path, out_med, "/ebook"),
        compress_gs(file_path, out_high, "/printer")
    )

    return {
        "low": {
            "name": "Extreme Compression",
            "url": f"/files/{req_id}/compressed_low.pdf",
            "size_bytes": os.path.getsize(out_low)
        },
        "medium": {
            "name": "Recommended",
            "url": f"/files/{req_id}/compressed_medium.pdf",
            "size_bytes": os.path.getsize(out_med)
        },
        "high": {
            "name": "High Quality",
            "url": f"/files/{req_id}/compressed_high.pdf",
            "size_bytes": os.path.getsize(out_high)
        }
    }
