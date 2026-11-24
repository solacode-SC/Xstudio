import os
import fitz
from tools.common import sanitize_stem, save_pdf_hq


async def run(files, opts, work_dir):
    file_path = files[0]
    stem = sanitize_stem(file_path, "document")
    mode = str(opts.get("mode") or "encrypt").lower()  # encrypt | unlock
    password = str(opts.get("password") or "")

    if not password:
        raise ValueError("Please enter a password.")

    with fitz.open(file_path) as doc:
        if mode == "unlock":
            if doc.needs_pass:
                auth = doc.authenticate(password)
                if auth == 0:
                    raise ValueError("Incorrect password — unable to unlock this PDF.")
            out_path = os.path.join(work_dir, f"{stem}_unlocked.pdf")
            doc.save(
                out_path,
                encryption=fitz.PDF_ENCRYPT_NONE,
                garbage=3,
                deflate=True,
            )
            return out_path

        # Encrypt mode (AES-256)
        if doc.needs_pass:
            raise ValueError("This PDF is already password-protected. Switch to Unlock mode first.")

        owner_pw = str(opts.get("owner_password") or password)
        allow_print = bool(opts.get("allow_print", True))
        allow_copy = bool(opts.get("allow_copy", False))

        perms = fitz.PDF_PERM_ACCESSIBILITY
        if allow_print:
            perms |= fitz.PDF_PERM_PRINT | fitz.PDF_PERM_PRINT_HQ
        if allow_copy:
            perms |= fitz.PDF_PERM_COPY

        out_path = os.path.join(work_dir, f"{stem}_protected.pdf")
        doc.save(
            out_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,
            user_pw=password,
            owner_pw=owner_pw,
            permissions=perms,
            garbage=3,
            deflate=True,
        )
        return out_path
