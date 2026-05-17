import os
from PIL import Image

def process_image_to_a4(img_path):
    # A4 dimensions at 300 DPI
    A4_WIDTH = 2480
    A4_HEIGHT = 3508
    
    img = Image.open(img_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    img_ratio = img.width / img.height
    a4_ratio = A4_WIDTH / A4_HEIGHT
    
    if img_ratio > a4_ratio:
        # Image is proportionally wider, fit to width
        new_width = A4_WIDTH
        new_height = int(new_width / img_ratio)
    else:
        # Image is proportionally taller, fit to height
        new_height = A4_HEIGHT
        new_width = int(new_height * img_ratio)
        
    # Resize with high quality Lanczos filter
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Create pure white A4 background
    background = Image.new('RGB', (A4_WIDTH, A4_HEIGHT), (255, 255, 255))
    
    # Center the image
    offset = ((A4_WIDTH - new_width) // 2, (A4_HEIGHT - new_height) // 2)
    background.paste(img, offset)
    
    return background

async def run(files, opts, work_dir):
    images = []
    
    for file_path in files:
        a4_img = process_image_to_a4(file_path)
        images.append(a4_img)
        
    out_path = os.path.join(work_dir, "converted_result.pdf")
    if images:
        images[0].save(out_path, "PDF", resolution=300.0, save_all=True, append_images=images[1:], quality=100)
        
    return out_path
