import fitz
import os
import zipfile

async def run(files, opts, work_dir):
    file_path = files[0]
    doc = fitz.open(file_path)
    
    zip_path = os.path.join(work_dir, "images.zip")
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for i in range(doc.page_count):
            page = doc.load_page(i)
            pix = page.get_pixmap()
            img_path = os.path.join(work_dir, f"page_{i+1}.jpg")
            pix.save(img_path)
            zipf.write(img_path, f"page_{i+1}.jpg")
            
    return zip_path
