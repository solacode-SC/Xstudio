/**
 * PDF to Images Tool - Export PDF pages as PNG/JPG images
 * Supports single page, selected pages, or all pages export
 */

function renderPdfToImagesTool() {
    const totalPages = AppState.pdfDocument?.numPages || 0;
    const selectedCount = AppState.selectedPages.size;
    
    return `
        ${renderToolHeader('PDF to Images', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="form-group">
                <label class="form-label">Image Format</label>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="imageFormat" value="png" checked>
                        <span class="radio-label">PNG (Lossless, larger)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="imageFormat" value="jpeg">
                        <span class="radio-label">JPG (Smaller, lossy)</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Quality / Resolution</label>
                <div class="slider-container">
                    <input type="range" class="slider" id="imageQualitySlider" min="1" max="3" value="2">
                    <div class="slider-labels">
                        <span>72 DPI</span>
                        <span>150 DPI</span>
                        <span>300 DPI</span>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Pages to Export</label>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="pageSelection" value="all" checked>
                        <span class="radio-label">All pages (${totalPages})</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="pageSelection" value="selected" ${selectedCount === 0 ? 'disabled' : ''}>
                        <span class="radio-label">Selected pages (${selectedCount})</span>
                    </label>
                </div>
            </div>
            
            <button class="btn-primary" id="pdfToImagesBtn" style="width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                Convert to Images
            </button>
        </div>
    `;
}

function attachPdfToImagesListeners() {
    document.getElementById('pdfToImagesBtn')?.addEventListener('click', processPdfToImages);
}

async function processPdfToImages() {
    const format = document.querySelector('input[name="imageFormat"]:checked').value;
    const qualityLevel = parseInt(document.getElementById('imageQualitySlider').value);
    const pageSelection = document.querySelector('input[name="pageSelection"]:checked').value;
    
    // DPI settings: 72, 150, 300
    const scaleMap = { 1: 1, 2: 2.08, 3: 4.17 }; // Relative to 72 DPI base
    const scale = scaleMap[qualityLevel];
    
    // Determine which pages to export
    let pagesToExport = [];
    if (pageSelection === 'selected' && AppState.selectedPages.size > 0) {
        pagesToExport = Array.from(AppState.selectedPages).sort((a, b) => a - b);
    } else {
        for (let i = 1; i <= AppState.pdfDocument.numPages; i++) {
            pagesToExport.push(i);
        }
    }
    
    showState('processing');
    setProgress(0);
    
    try {
        const images = [];
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpeg' ? 0.92 : undefined;
        
        for (let i = 0; i < pagesToExport.length; i++) {
            const pageNum = pagesToExport[i];
            const page = await AppState.pdfDocument.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // White background for JPG (no transparency)
            if (format === 'jpeg') {
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const dataUrl = canvas.toDataURL(mimeType, quality);
            images.push({
                pageNum,
                dataUrl,
                extension: format === 'png' ? 'png' : 'jpg'
            });
            
            setProgress(Math.round(((i + 1) / pagesToExport.length) * 90));
        }
        
        // Download images
        if (images.length === 1) {
            // Single image - direct download
            downloadDataUrl(images[0].dataUrl, `${getBaseFileName()}_page_${images[0].pageNum}.${images[0].extension}`);
        } else {
            // Multiple images - create ZIP
            await downloadImagesAsZip(images, format);
        }
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${images.length} image${images.length > 1 ? 's' : ''}</span><span>•</span><span>${format.toUpperCase()} format</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Conversion complete!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('PDF to Images error:', error);
        showError('Failed to convert PDF: ' + error.message);
    }
}

function downloadDataUrl(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function downloadImagesAsZip(images, format) {
    // Use JSZip if available, otherwise download individually
    if (typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        const folder = zip.folder('images');
        
        for (const img of images) {
            const base64Data = img.dataUrl.split(',')[1];
            folder.file(`page_${img.pageNum}.${img.extension}`, base64Data, { base64: true });
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${getBaseFileName()}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        // Fallback: download each image individually with delay
        for (let i = 0; i < images.length; i++) {
            setTimeout(() => {
                downloadDataUrl(images[i].dataUrl, `${getBaseFileName()}_page_${images[i].pageNum}.${images[i].extension}`);
            }, i * 500);
        }
    }
}
