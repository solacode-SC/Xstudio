import fitz
import os
from docx import Document

async def run(files, opts, work_dir):
    file_path = files[0]
    doc = fitz.open(file_path)
    
    word_doc = Document()
    
    for i in range(doc.page_count):
        page = doc.load_page(i)
        text = page.get_text()
        if text:
            word_doc.add_paragraph(text)
        if i < doc.page_count - 1:
            word_doc.add_page_break()
            
    out_path = os.path.join(work_dir, "converted.docx")
    word_doc.save(out_path)
    return out_path
