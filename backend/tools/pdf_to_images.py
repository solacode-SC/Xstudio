import os
import io
import zipfile
import asyncio
import fitz
from PIL import Image
from tools.common import sanitize_stem, parse_page_spec

MAX_AXIS_PX = 9000


def _render_pages(file_path: str, work_dir: str, stem: str, dpi: int, fmt: str, pages_spec: str):
    ext_map = {"png": "png", "jpg": "jpg", "jpeg": "jpg", "webp": "webp"}
    ext = ext_map.get(fmt.lower(), "png")

    with fitz.open(file_path) as doc:
        total = doc.page_count
        if total == 0:
            raise ValueError("The uploaded PDF contains 0 pages.")

        if pages_spec:
            indices = parse_page_spec(pages_spec, total, deduplicate=True)
            if not indices:
                raise ValueError(f"No valid pages matched '{pages_spec}' (document has {total} pages).")
        else:
            indices = list(range(total))

        rendered_paths = []
        render_dir = os.path.join(work_dir, "rendered")
        os.makedirs(render_dir, exist_ok=True)
        pad = max(3, len(str(total)))

        for p in indices:
            page = doc.load_page(p)
            rect = page.rect
            scale = dpi / 72.0
            max_dim = max(rect.width * scale, rect.height * scale)
            if max_dim > MAX_AXIS_PX and max_dim > 0:
                scale = MAX_AXIS_PX / max(rect.width, rect.height)

            matrix = fitz.Matrix(scale, scale)
            pix = page.get_pixmap(matrix=matrix, alpha=False)

            img_name = f"{stem}_page_{p + 1:0{pad}d}.{ext}"
            img_path = os.path.join(render_dir, img_name)

            if ext == "png":
                pix.save(img_path)
            else:
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                if ext == "jpg":
                    img.save(img_path, format="JPEG", quality=95, subsampling=0, optimize=True, dpi=(dpi, dpi))
                elif ext == "webp":
                    img.save(img_path, format="WEBP", quality=95, method=4)
                img.close()

            rendered_paths.append((img_path, img_name))

        # Return direct crisp image if only 1 page rendered
        if len(rendered_paths) == 1:
            src_path, img_name = rendered_paths[0]
            direct_out = os.path.join(work_dir, img_name)
            os.replace(src_path, direct_out)
            return direct_out

        zip_path = os.path.join(work_dir, f"{stem}_{dpi}dpi_{ext}.zip")
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
            for src_path, img_name in rendered_paths:
                zipf.write(src_path, img_name)

        return zip_path


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")
    dpi = int(opts.get("dpi") or 300)
    dpi = max(72, min(600, dpi))
    fmt = str(opts.get("format") or "png")
    pages_spec = (opts.get("pages") or "").strip()

    return await asyncio.to_thread(_render_pages, file_path, work_dir, stem, dpi, fmt, pages_spec)
