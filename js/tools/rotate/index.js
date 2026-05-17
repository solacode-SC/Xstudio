/**
 * Rotate Tool - Rotate PDF pages
 */

function renderRotateTool() {
    const selectedCount = AppState.selectedPages.size;
    const totalPages = AppState.pdfDocument?.numPages || 0;
    
    return `
        ${renderToolHeader('Rotate Pages', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                ${selectedCount > 0 ? `Rotating ${selectedCount} selected page(s)` : `Rotating all ${totalPages} pages`}
            </p>
            <div class="rotate-options">
                <button class="rotate-btn" data-rotation="-90">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                    <span>90° Left</span>
                </button>
                <button class="rotate-btn" data-rotation="90">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    <span>90° Right</span>
                </button>
                <button class="rotate-btn" data-rotation="180">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="17 1 21 5 17 9"/>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                        <polyline points="7 23 3 19 7 15"/>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                    <span>180°</span>
                </button>
            </div>
        </div>
    `;
}

function attachRotateListeners() {
    document.querySelectorAll('.rotate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rotation = parseInt(btn.dataset.rotation);
            processRotate(rotation);
        });
    });
}

async function processRotate(degrees) {
    const pages = AppState.selectedPages.size > 0 
        ? Array.from(AppState.selectedPages) 
        : Array.from({ length: AppState.pdfDocument.numPages }, (_, i) => i + 1);
    
    showState('processing');
    setProgress(0);
    
    try {
        const { PDFDocument, degrees: pdfDegrees } = PDFLib;
        
        const pdfDoc = await PDFDocument.load(AppState.pdfBytes);
        const allPages = pdfDoc.getPages();
        
        setProgress(30);
        
        pages.forEach((pageNum, idx) => {
            const page = allPages[pageNum - 1];
            if (page) {
                const currentRotation = page.getRotation().angle;
                page.setRotation(pdfDegrees(currentRotation + degrees));
            }
            setProgress(30 + ((idx + 1) / pages.length) * 50);
        });
        
        processedPdfBytes = await pdfDoc.save();
        processedFileName = AppState.pdfFile.name.replace('.pdf', '_rotated.pdf');
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${pages.length} pages rotated</span><span>•</span><span>${degrees}°</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Rotation complete!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('Rotate error:', error);
        showError('Failed to rotate PDF: ' + error.message);
    }
}
