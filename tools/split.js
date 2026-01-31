/**
 * Split Tool - Divide PDF into parts by page range
 */

function renderSplitTool() {
    const totalPages = AppState.pdfDocument?.numPages || 1;
    return `
        ${renderToolHeader('Split PDF', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">From Page</label>
                    <input type="number" class="form-input" id="splitFrom" min="1" value="1">
                </div>
                <div class="form-group">
                    <label class="form-label">To Page</label>
                    <input type="number" class="form-input" id="splitTo" min="1" value="${totalPages}">
                </div>
            </div>
            <p style="font-size: 12px; color: var(--text-light);">Total pages: ${totalPages}</p>
            <button class="btn-primary" id="splitBtn" style="width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                </svg>
                Split PDF
            </button>
        </div>
    `;
}

function attachSplitListeners() {
    document.getElementById('splitBtn')?.addEventListener('click', processSplit);
}

async function processSplit() {
    const from = parseInt(document.getElementById('splitFrom').value);
    const to = parseInt(document.getElementById('splitTo').value);
    const totalPages = AppState.pdfDocument.numPages;
    
    if (from < 1 || to > totalPages || from > to) {
        showToast('Invalid page range', 'error');
        return;
    }
    
    showState('processing');
    setProgress(0);
    
    try {
        const { PDFDocument } = PDFLib;
        
        // Load the source PDF
        const sourcePdf = await PDFDocument.load(AppState.pdfBytes);
        const newPdf = await PDFDocument.create();
        
        setProgress(30);
        
        // Copy pages from the range
        const pageIndices = [];
        for (let i = from - 1; i < to; i++) {
            pageIndices.push(i);
        }
        
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        setProgress(70);
        
        // Save the new PDF
        processedPdfBytes = await newPdf.save();
        processedFileName = AppState.pdfFile.name.replace('.pdf', `_pages_${from}-${to}.pdf`);
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${to - from + 1} pages</span><span>•</span><span>Pages ${from} to ${to}</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Split complete!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('Split error:', error);
        showError('Failed to split PDF: ' + error.message);
    }
}
