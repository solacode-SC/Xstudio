import os
import shutil
import asyncio
import fitz
from tools.common import sanitize_stem


async def run_ghostscript(input_file: str, output_file: str, color_dpi: int, quality_preset: str):
    cmd = [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.5",
        f"-dPDFSETTINGS={quality_preset}",
        "-dAutoRotatePages=/None",
        "-dColorImageDownsampleType=/Bicubic",
        "-dDownsampleColorImages=true",
        f"-dColorImageResolution={color_dpi}",
        "-dGrayImageDownsampleType=/Bicubic",
        "-dDownsampleGrayImages=true",
        f"-dGrayImageResolution={color_dpi}",
        "-dMonoImageDownsampleType=/Subsample",
        "-dDownsampleMonoImages=true",
        f"-dMonoImageResolution={max(300, color_dpi * 2)}",
        "-dDetectDuplicateImages=true",
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_file}",
        input_file,
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()
    except Exception:
        pass


def optimize_lossless(input_file: str, output_file: str):
    with fitz.open(input_file) as doc:
        doc.save(
            output_file,
            garbage=4,
            clean=True,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
        )


async def run(files, opts, work_dir):
    file_path = files[0]
    req_id = os.path.basename(work_dir)
    stem = sanitize_stem(file_path, "document")
    preferred = opts.get("quality", "medium")
    orig_size = os.path.getsize(file_path)

    with fitz.open(file_path) as doc:
        page_count = doc.page_count

    out_lossless = os.path.join(work_dir, f"{stem}_lossless.pdf")
    out_high = os.path.join(work_dir, f"{stem}_high_300dpi.pdf")
    out_med = os.path.join(work_dir, f"{stem}_balanced_180dpi.pdf")
    out_low = os.path.join(work_dir, f"{stem}_compact_110dpi.pdf")

    await asyncio.to_thread(optimize_lossless, file_path, out_lossless)
    if not os.path.exists(out_lossless) or os.path.getsize(out_lossless) > orig_size:
        shutil.copy2(file_path, out_lossless)

    lossless_size = os.path.getsize(out_lossless)

    await asyncio.gather(
        run_ghostscript(out_lossless, out_high, 300, "/prepress"),
        run_ghostscript(out_lossless, out_med, 180, "/ebook"),
        run_ghostscript(out_lossless, out_low, 110, "/ebook"),
    )

    # Smart size guard: never return a compressed tier that grew larger than lossless optimization
    for candidate in (out_high, out_med, out_low):
        if not os.path.exists(candidate) or os.path.getsize(candidate) == 0 or os.path.getsize(candidate) > lossless_size:
            shutil.copy2(out_lossless, candidate)

    def build_entry(key: str, label: str, badge: str, desc: str, path: str):
        sz = os.path.getsize(path)
        fname = os.path.basename(path)
        savings = max(0.0, round((1.0 - (sz / orig_size)) * 100, 1)) if orig_size > 0 else 0.0
        return {
            "key": key,
            "name": label,
            "badge": badge,
            "desc": desc,
            "filename": fname,
            "url": f"/files/{req_id}/{fname}",
            "size_bytes": sz,
            "savings_pct": savings,
        }

    return {
        "preferred": preferred,
        "page_count": page_count,
        "results": {
            "lossless": build_entry(
                "lossless",
                "Lossless Structure",
                "100% LOSSLESS",
                "Deduplicates streams & fonts with zero pixel changes",
                out_lossless,
            ),
            "high": build_entry(
                "high",
                "Print Quality",
                "300 DPI",
                "Sharp vectors & 300 DPI bicubic images for print",
                out_high,
            ),
            "medium": build_entry(
                "medium",
                "Balanced Studio",
                "RECOMMENDED",
                "Crisp typography with 180 DPI smart image optimization",
                out_med,
            ),
            "low": build_entry(
                "low",
                "Maximum Reduction",
                "COMPACT",
                "Smallest footprint for email & web portals (110 DPI)",
                out_low,
            ),
        },
    }
