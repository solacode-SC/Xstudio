/**
 * Delete Tool - Remove pages from PDF
 */

function renderDeleteTool() {
    const totalPages = AppState.pdfDocument?.numPages || 0;
    const selectedCount = AppState.selectedPages.size;
    
    let pageChips = '';
    for (let i = 1; i <= totalPages; i++) {
        const isSelected = AppState.selectedPages.has(i);
        pageChips += `<div class="page-chip ${isSelected ? 'selected' : ''}" data-page="${i}">Page ${i}</div>`;
    }
    
    return `
        ${renderToolHeader('Delete Pages', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
        `, 'background: var(--error-light); color: var(--error);')}
        <div class="tool-panel-content">
            <div class="page-selection">
                <div class="page-selection-header">
                    <span class="form-label">Select pages to delete</span>
                    <div class="select-actions">
                        <button id="selectAllPages">Select All</button>
                        <button id="deselectAllPages">Deselect All</button>
                    </div>
                </div>
                <div class="page-list">
                    ${pageChips}
                </div>
            </div>
            <button class="btn-danger" id="deleteBtn" style="width: 100%;" ${selectedCount === 0 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete ${selectedCount > 0 ? selectedCount + ' Page' + (selectedCount > 1 ? 's' : '') : 'Selected'}
            </button>
        </div>
    `;
}

function attachDeleteListeners() {
    document.getElementById('selectAllPages')?.addEventListener('click', () => {
        selectAllPages();
        renderToolPanel('delete');
    });
    document.getElementById('deselectAllPages')?.addEventListener('click', () => {
        deselectAllPages();
        renderToolPanel('delete');
    });
    document.querySelectorAll('.page-chip[data-page]').forEach(chip => {
        chip.addEventListener('click', () => {
            const page = parseInt(chip.dataset.page);
            togglePageSelection(page);
            renderToolPanel('delete');
        });
    });
    document.getElementById('deleteBtn')?.addEventListener('click', () => {
        const count = AppState.selectedPages.size;
        if (count === 0) return;
        showConfirmDialog(
            'Delete Pages',
            `Are you sure you want to delete ${count} page${count > 1 ? 's' : ''}? This cannot be undone.`,
            processDelete
        );
    });
}

async function processDelete() {
    if (AppState.selectedPages.size === 0) {
        showToast('Select pages to delete', 'error');
        return;
    }
    
    if (AppState.selectedPages.size >= AppState.pdfDocument.numPages) {
        showToast('Cannot delete all pages', 'error');
        return;
    }
    
    showState('processing');
    setProgress(0);
    
    try {
        const { PDFDocument } = PDFLib;
        
        const sourcePdf = await PDFDocument.load(AppState.pdfBytes);
        const newPdf = await PDFDocument.create();
        
        setProgress(30);
        
        // Get pages to keep (not selected for deletion)
        const pagesToKeep = [];
        for (let i = 1; i <= AppState.pdfDocument.numPages; i++) {
            if (!AppState.selectedPages.has(i)) {
                pagesToKeep.push(i - 1); // 0-indexed
            }
        }
        
        const copiedPages = await newPdf.copyPages(sourcePdf, pagesToKeep);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        setProgress(70);
        
        processedPdfBytes = await newPdf.save();
        processedFileName = AppState.pdfFile.name.replace('.pdf', '_edited.pdf');
        
        setProgress(100);
        
        const remaining = AppState.pdfDocument.numPages - AppState.selectedPages.size;
        DOM.successInfo.innerHTML = `<span>${remaining} pages remaining</span><span>•</span><span>${AppState.selectedPages.size} deleted</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Pages deleted!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete pages: ' + error.message);
    }
}
