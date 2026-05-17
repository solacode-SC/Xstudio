/**
 * Compress Tool - Reduce PDF file size
 */

function renderCompressTool() {
    return `
        ${renderToolHeader('Compress PDF', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="form-group">
                <label class="form-label">Quality Level</label>
                <div class="slider-container">
                    <input type="range" class="slider" id="qualitySlider" min="1" max="3" value="2">
                    <div class="slider-labels">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                    </div>
                </div>
            </div>
            <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; text-align: center;">
                <p style="font-size: 12px; color: var(--text-light);">Estimated reduction</p>
                <p style="font-size: 24px; font-weight: 600; color: var(--success);" id="reductionEstimate">~40%</p>
            </div>
            <div class="warning-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p>Compression converts pages to images. Text will no longer be selectable or searchable.</p>
            </div>
            <button class="btn-primary" id="compressBtn" style="width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                </svg>
                Compress PDF
            </button>
        </div>
    `;
}

function attachCompressListeners() {
    document.getElementById('qualitySlider')?.addEventListener('input', (e) => {
        const estimates = ['~60%', '~40%', '~20%'];
        document.getElementById('reductionEstimate').textContent = estimates[e.target.value - 1];
    });
    document.getElementById('compressBtn')?.addEventListener('click', processCompress);
}

async function processCompress() {
    const qualityLevel = parseInt(document.getElementById('qualitySlider').value);
    
    // Scale and quality settings
    // 1: Low (Smallest size) - Scale 1.0, JPEG 0.5
    // 2: Medium (Balanced)   - Scale 1.5, JPEG 0.7
    // 3: High (Values Quality) - Scale 2.0, JPEG 0.8
    const settings = {
        1: { scale: 1.0, quality: 0.5 },
        2: { scale: 1.5, quality: 0.7 },
        3: { scale: 2.0, quality: 0.8 } 
    };
    
    const config = settings[qualityLevel];

    showState('processing');
    setProgress(0);
    
    try {
        const { PDFDocument } = PDFLib;
        const newPdf = await PDFDocument.create();
        const numPages = AppState.pdfDocument.numPages;
        
        for (let i = 1; i <= numPages; i++) {
            // Update progress
            const progress = Math.round((i / numPages) * 90);
            setProgress(progress);
            
            // Render page to canvas
            const page = await AppState.pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: config.scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // White background for transparent pages
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Convert to simple JPEG to compress
            const imgDataUrl = canvas.toDataURL('image/jpeg', config.quality);
            const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
            
            // Add to new PDF
            const jpgImage = await newPdf.embedJpg(imgBytes);
            
            // Use original page dimensions
            const originalViewport = page.getViewport({ scale: 1.0 });
            const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
            newPage.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: originalViewport.width,
                height: originalViewport.height,
            });
        }
        
        // Final save with object streams
        processedPdfBytes = await newPdf.save({
            useObjectStreams: true,
            addDefaultPage: false
        });
        
        const originalSize = AppState.pdfBytes.byteLength;
        const newSize = processedPdfBytes.length;
        const reduction = Math.round((1 - newSize / originalSize) * 100);
        
        processedFileName = AppState.pdfFile.name.replace('.pdf', '_compressed.pdf');
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${AppState.pdfDocument.numPages} pages</span><span>•</span><span>${Math.max(reduction, 0)}% smaller</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Compression complete!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('Compress error:', error);
        showError('Failed to compress PDF: ' + error.message);
    }
}
