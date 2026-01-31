/**
 * Extract Tool - Extract specific pages from PDF
 */

function renderExtractTool() {
    const totalPages = AppState.pdfDocument?.numPages || 0;
    const selectedCount = AppState.selectedPages.size;
    
    let pageChips = '';
    for (let i = 1; i <= Math.min(totalPages, 20); i++) {
        const isSelected = AppState.selectedPages.has(i);
        pageChips += `<div class="page-chip ${isSelected ? 'selected' : ''}" data-page="${i}">Page ${i}</div>`;
    }
    if (totalPages > 20) {
        pageChips += `<div class="page-chip" style="background: transparent;">+${totalPages - 20} more</div>`;
    }
    
    return `
        ${renderToolHeader('Extract Pages', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M12 18v-6"/>
                <path d="M9 15l3-3 3 3"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="page-selection">
                <div class="page-selection-header">
                    <span class="form-label">Select pages to extract</span>
                    <div class="select-actions">
                        <button id="selectAllPages">Select All</button>
                        <button id="deselectAllPages">Deselect All</button>
                    </div>
                </div>
                <div class="page-list">
                    ${pageChips}
                </div>
            </div>
            <button class="btn-primary" id="extractBtn" style="width: 100%;" ${selectedCount === 0 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                Extract ${selectedCount > 0 ? selectedCount + ' Page' + (selectedCount > 1 ? 's' : '') : 'Selected'}
            </button>
        </div>
    `;
}

function attachExtractListeners() {
    document.getElementById('selectAllPages')?.addEventListener('click', () => {
        selectAllPages();
        renderToolPanel('extract');
    });
    document.getElementById('deselectAllPages')?.addEventListener('click', () => {
        deselectAllPages();
        renderToolPanel('extract');
    });
    document.querySelectorAll('.page-chip[data-page]').forEach(chip => {
        chip.addEventListener('click', () => {
            const page = parseInt(chip.dataset.page);
            togglePageSelection(page);
            renderToolPanel('extract');
        });
    });
    document.getElementById('extractBtn')?.addEventListener('click', processExtract);
}

async function processExtract() {
    if (AppState.selectedPages.size === 0) {
        showToast('Select pages to extract', 'error');
        return;
    }
    
    showState('processing');
    setProgress(0);
    
    try {
        const { PDFDocument } = PDFLib;
        
        const sourcePdf = await PDFDocument.load(AppState.pdfBytes);
        const newPdf = await PDFDocument.create();
        
        setProgress(30);
        
        // Get pages to extract (only selected ones)
        // Sort them to match document order
        const pagesToExtract = [];
        for (let i = 1; i <= AppState.pdfDocument.numPages; i++) {
            if (AppState.selectedPages.has(i)) {
                pagesToExtract.push(i - 1); // 0-indexed
            }
        }
        
        const copiedPages = await newPdf.copyPages(sourcePdf, pagesToExtract);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        setProgress(70);
        
        processedPdfBytes = await newPdf.save();
        processedFileName = AppState.pdfFile.name.replace('.pdf', '_extracted.pdf');
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${AppState.selectedPages.size} pages extracted</span><span>•</span><span>${formatFileSize(processedPdfBytes.length)}</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Pages extracted!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('Extract error:', error);
        showError('Failed to extract pages: ' + error.message);
    }
}
