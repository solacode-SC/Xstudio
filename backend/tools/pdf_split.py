import os
import zipfile
import fitz
from tools.common import sanitize_stem, parse_range_groups, save_pdf_hq


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")

    mode = opts.get("mode", "ranges")  # "ranges" | "every_n" | "burst"
    ranges_str = (opts.get("ranges") or "").strip()
    every_n = max(1, int(opts.get("every_n") or 1))
    merge_ranges = bool(opts.get("merge_ranges", False))

    with fitz.open(file_path) as doc:
        total = doc.page_count
        if total == 0:
            raise ValueError("The uploaded PDF contains 0 pages.")

        groups = []
        if mode == "burst":
            groups = [([i], f"page_{i + 1:03d}") for i in range(total)]
        elif mode == "every_n":
            for start in range(0, total, every_n):
                end = min(total, start + every_n)
                indices = list(range(start, end))
                label = f"p{start + 1}-{end}" if len(indices) > 1 else f"p{start + 1}"
                groups.append((indices, label))
        else:
            if ranges_str:
                groups = parse_range_groups(ranges_str, total)
                if not groups:
                    raise ValueError(f"No valid pages matched '{ranges_str}' (document has {total} pages).")
            else:
                # Default when no range entered: burst into individual pages if >1 page, else single copy
                if total > 1:
                    groups = [([i], f"page_{i + 1:03d}") for i in range(total)]
                else:
                    groups = [([0], "p1")]

        # Single output PDF when only 1 group or merge_ranges=True
        if len(groups) == 1 or (merge_ranges and mode == "ranges"):
            out_doc = fitz.open()
            for indices, _ in groups:
                for p in indices:
                    out_doc.insert_pdf(doc, from_page=p, to_page=p, links=True, annots=True)
            out_path = os.path.join(work_dir, f"{stem}_split.pdf")
            save_pdf_hq(out_doc, out_path)
            out_doc.close()
            return out_path

        # Multiple split PDFs packaged cleanly in a ZIP archive
        parts_dir = os.path.join(work_dir, "split_parts")
        os.makedirs(parts_dir, exist_ok=True)
        zip_path = os.path.join(work_dir, f"{stem}_split_{len(groups)}_files.zip")

        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
            for idx, (indices, label) in enumerate(groups, start=1):
                part_doc = fitz.open()
                for p in indices:
                    part_doc.insert_pdf(doc, from_page=p, to_page=p, links=True, annots=True)
                part_name = f"{stem}_{idx:02d}_{label}.pdf"
                part_path = os.path.join(parts_dir, part_name)
                save_pdf_hq(part_doc, part_path)
                part_doc.close()
                zipf.write(part_path, part_name)

        return zip_path
