import os
import re
import fitz
from typing import List, Tuple


def sanitize_stem(filename: str, fallback: str = "document") -> str:
    base = os.path.splitext(os.path.basename(filename or fallback))[0]
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._-")
    return cleaned[:60] if cleaned else fallback


def parse_page_spec(spec: str, total_pages: int, deduplicate: bool = False) -> List[int]:
    """
    Parse 1-based page specification like '1-3, 5, 8-end' into 0-based page indices.
    Preserves user-specified order unless deduplicate=True with sorting needed by caller.
    """
    if not spec or not spec.strip():
        return []

    result: List[int] = []
    seen = set()

    for raw_part in spec.split(","):
        part = raw_part.strip().lower()
        if not part:
            continue

        if "-" in part:
            pieces = part.split("-", 1)
            left, right = pieces[0].strip(), pieces[1].strip()
            try:
                start = 1 if left == "" else int(left)
                end = total_pages if right in ("", "end", "last") else int(right)
            except ValueError:
                continue

            if start <= end:
                s = max(1, start)
                e = min(total_pages, end)
                indices = range(s - 1, e)
            else:
                s = min(total_pages, start)
                e = max(1, end)
                indices = range(s - 1, e - 2, -1)

            for idx in indices:
                if 0 <= idx < total_pages:
                    if not deduplicate or idx not in seen:
                        result.append(idx)
                        seen.add(idx)
        else:
            try:
                p = total_pages if part in ("end", "last") else int(part)
                idx = p - 1
                if 0 <= idx < total_pages:
                    if not deduplicate or idx not in seen:
                        result.append(idx)
                        seen.add(idx)
            except ValueError:
                continue

    return result


def parse_range_groups(spec: str, total_pages: int) -> List[Tuple[List[int], str]]:
    """
    Parse comma-separated groups into distinct segments for PDF splitting.
    e.g., '1-3, 4-6, 8' -> [([0,1,2], 'p1-3'), ([3,4,5], 'p4-6'), ([7], 'p8')]
    """
    groups: List[Tuple[List[int], str]] = []
    if not spec or not spec.strip():
        return groups

    for raw_part in spec.split(","):
        part = raw_part.strip()
        if not part:
            continue
        pages = parse_page_spec(part, total_pages, deduplicate=False)
        if pages:
            label = f"p{pages[0] + 1}-{pages[-1] + 1}" if len(pages) > 1 else f"p{pages[0] + 1}"
            groups.append((pages, label))

    return groups


def save_pdf_hq(doc: fitz.Document, out_path: str) -> str:
    """
    Save PDF with lossless stream compression and unreferenced object garbage collection.
    Preserves 100% of vector paths, embedded fonts, links, and raster pixel fidelity.
    """
    doc.save(
        out_path,
        garbage=3,
        deflate=True,
        deflate_images=True,
        deflate_fonts=True,
    )
    return out_path


def get_pdf_page_count(path: str) -> int | None:
    if not path.lower().endswith(".pdf") or not os.path.exists(path):
        return None
    try:
        with fitz.open(path) as doc:
            return doc.page_count
    except Exception:
        return None
