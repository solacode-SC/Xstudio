/**
 * Images to PDF Tool - Convert multiple images to a single PDF
 * Supports PNG, JPG, JPEG, WebP, GIF formats
 */

// Store images for conversion
let imagesToConvert = [];

function renderImagesToPdfTool() {
    const imageList = imagesToConvert.length > 0 
        ? imagesToConvert.map((img, idx) => `
            <div class="file-list-item" data-index="${idx}">
                <div class="drag-handle">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                    </svg>
                </div>
                <div class="file-list-info">
                    <div class="file-list-name">${truncateFileName(img.name, 25)}</div>
                    <div class="file-list-pages">${img.width} × ${img.height}</div>
                </div>
                <button class="file-list-remove" data-index="${idx}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('')
        : '<p style="text-align: center; color: var(--text-light); padding: 20px 0;">No images added yet</p>';
    
    return `
        ${renderToolHeader('Images to PDF', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="file-list" id="imageFileList" style="max-height: 200px; overflow-y: auto;">
                ${imageList}
            </div>
            
            <button class="add-file-btn" id="addImagesBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Images
            </button>
            <input type="file" id="imageFilesInput" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" hidden multiple>
            
            <div class="form-group" style="margin-top: 12px;">
                <label class="form-label">Page Size</label>
                <select class="form-input" id="pageSizeSelect">
                    <option value="fit">Fit to Image</option>
                    <option value="a4">A4 (210 × 297 mm)</option>
                    <option value="letter">Letter (8.5 × 11 in)</option>
                    <option value="a3">A3 (297 × 420 mm)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Image Fit</label>
                <select class="form-input" id="imageFitSelect">
                    <option value="contain">Fit (maintain aspect ratio)</option>
                    <option value="cover">Fill (crop to fit)</option>
                    <option value="stretch">Stretch (ignore aspect ratio)</option>
                </select>
            </div>
            
            <button class="btn-primary" id="imagesToPdfBtn" style="width: 100%;" ${imagesToConvert.length === 0 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                Create PDF
            </button>
        </div>
    `;
}

function attachImagesToPdfListeners() {
    document.getElementById('addImagesBtn')?.addEventListener('click', () => {
        document.getElementById('imageFilesInput').click();
    });
    
    document.getElementById('imageFilesInput')?.addEventListener('change', handleImageFilesSelect);
    document.getElementById('imagesToPdfBtn')?.addEventListener('click', processImagesToPdf);
    
    // Remove image buttons
    document.querySelectorAll('#imageFileList .file-list-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.currentTarget.dataset.index);
            imagesToConvert.splice(index, 1);
            renderToolPanel('images-to-pdf');
        });
    });
}

async function handleImageFilesSelect(e) {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            showToast(`${file.name} is not an image`, 'error');
            continue;
        }
        
        try {
            const dimensions = await getImageDimensions(file);
            const bytes = await file.arrayBuffer();
            
            imagesToConvert.push({
                name: file.name,
                type: file.type,
                bytes: new Uint8Array(bytes),
                width: dimensions.width,
                height: dimensions.height
            });
        } catch (error) {
            showToast(`Failed to load ${file.name}`, 'error');
        }
    }
    
    renderToolPanel('images-to-pdf');
    e.target.value = '';
}

function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

async function processImagesToPdf() {
    if (imagesToConvert.length === 0) {
        showToast('Add at least one image', 'error');
        return;
    }
    
    const pageSize = document.getElementById('pageSizeSelect').value;
    const imageFit = document.getElementById('imageFitSelect').value;
    
    // Page dimensions in points (72 points = 1 inch)
    const pageSizes = {
        a4: { width: 595.28, height: 841.89 },
        letter: { width: 612, height: 792 },
        a3: { width: 841.89, height: 1190.55 }
    };
    
    showState('processing');
    setProgress(0);
    
    try {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        
        for (let i = 0; i < imagesToConvert.length; i++) {
            const img = imagesToConvert[i];
            
            // Embed image based on type
            let embeddedImage;
            if (img.type === 'image/png') {
                embeddedImage = await pdfDoc.embedPng(img.bytes);
            } else if (img.type === 'image/jpeg' || img.type === 'image/jpg') {
                embeddedImage = await pdfDoc.embedJpg(img.bytes);
            } else {
                // Convert other formats to PNG via canvas
                const converted = await convertImageToPng(img.bytes, img.type);
                embeddedImage = await pdfDoc.embedPng(converted);
            }
            
            // Determine page dimensions
            let pageWidth, pageHeight;
            if (pageSize === 'fit') {
                pageWidth = embeddedImage.width;
                pageHeight = embeddedImage.height;
            } else {
                const size = pageSizes[pageSize];
                pageWidth = size.width;
                pageHeight = size.height;
            }
            
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            
            // Calculate image dimensions and position
            const imgDims = calculateImageDimensions(
                embeddedImage.width,
                embeddedImage.height,
                pageWidth,
                pageHeight,
                imageFit
            );
            
            page.drawImage(embeddedImage, {
                x: imgDims.x,
                y: imgDims.y,
                width: imgDims.width,
                height: imgDims.height
            });
            
            setProgress(Math.round(((i + 1) / imagesToConvert.length) * 90));
        }
        
        processedPdfBytes = await pdfDoc.save();
        processedFileName = 'images_combined.pdf';
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${imagesToConvert.length} images</span><span>•</span><span>${formatFileSize(processedPdfBytes.length)}</span>`;
        
        // Clear images after successful conversion
        imagesToConvert = [];
        
        setTimeout(() => {
            showState('success');
            showToast('PDF created!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('Images to PDF error:', error);
        showError('Failed to create PDF: ' + error.message);
    }
}

function calculateImageDimensions(imgWidth, imgHeight, pageWidth, pageHeight, fit) {
    let width, height, x, y;
    
    const imgRatio = imgWidth / imgHeight;
    const pageRatio = pageWidth / pageHeight;
    
    if (fit === 'stretch') {
        width = pageWidth;
        height = pageHeight;
        x = 0;
        y = 0;
    } else if (fit === 'cover') {
        if (imgRatio > pageRatio) {
            height = pageHeight;
            width = height * imgRatio;
        } else {
            width = pageWidth;
            height = width / imgRatio;
        }
        x = (pageWidth - width) / 2;
        y = (pageHeight - height) / 2;
    } else { // contain
        if (imgRatio > pageRatio) {
            width = pageWidth;
            height = width / imgRatio;
        } else {
            height = pageHeight;
            width = height * imgRatio;
        }
        x = (pageWidth - width) / 2;
        y = (pageHeight - height) / 2;
    }
    
    return { x, y, width, height };
}

async function convertImageToPng(bytes, mimeType) {
    return new Promise((resolve, reject) => {
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                blob.arrayBuffer().then(buffer => {
                    URL.revokeObjectURL(url);
                    resolve(new Uint8Array(buffer));
                });
            }, 'image/png');
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to convert image'));
        };
        
        img.src = url;
    });
}
