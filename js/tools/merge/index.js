/**
 * Merge Tool - Combine multiple PDFs into one
 */

function renderMergeTool() {
    const fileList = AppState.mergeFiles.length > 0 
        ? AppState.mergeFiles.map((file, idx) => `
            <div class="file-list-item" data-index="${idx}">
                <div class="drag-handle">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                    </svg>
                </div>
                <div class="file-list-info">
                    <div class="file-list-name">${truncateFileName(file.name, 25)}</div>
                    <div class="file-list-pages">${file.pages} pages</div>
                </div>
                <button class="file-list-remove" data-index="${idx}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('')
        : '<p style="text-align: center; color: var(--text-light); padding: 20px 0;">No files added yet</p>';
    
    return `
        ${renderToolHeader('Merge PDFs', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 3 21 3 21 8"/>
                <line x1="4" y1="20" x2="21" y2="3"/>
                <polyline points="21 16 21 21 16 21"/>
                <line x1="15" y1="15" x2="21" y2="21"/>
                <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="file-list" id="mergeFileList">
                ${fileList}
            </div>
            <button class="add-file-btn" id="addMergeFile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add PDF
            </button>
            <input type="file" id="mergeFileInput" accept=".pdf" hidden multiple>
            <button class="btn-primary" id="mergeBtn" style="width: 100%;" ${AppState.mergeFiles.length < 2 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                </svg>
                Merge All
            </button>
        </div>
    `;
}

function attachMergeListeners() {
    document.getElementById('addMergeFile')?.addEventListener('click', () => {
        document.getElementById('mergeFileInput').click();
    });
    document.getElementById('mergeFileInput')?.addEventListener('change', handleMergeFiles);
    document.getElementById('mergeBtn')?.addEventListener('click', processMerge);
    
    // Remove file buttons
    document.querySelectorAll('.file-list-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            AppState.mergeFiles.splice(index, 1);
            renderToolPanel('merge');
        });
    });
}

async function handleMergeFiles(e) {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        if (file.type !== 'application/pdf') {
            showToast(`${file.name} is not a PDF`, 'error');
            continue;
        }
        
        try {
            const bytes = await file.arrayBuffer();
            // Pass a copy to pdfjsLib
            const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
            
            AppState.mergeFiles.push({
                name: file.name,
                bytes: new Uint8Array(bytes),
                pages: pdf.numPages
            });
        } catch (error) {
            showToast(`Failed to load ${file.name}`, 'error');
        }
    }
    
    renderToolPanel('merge');
    e.target.value = '';
}

async function processMerge() {
    if (AppState.mergeFiles.length < 2) {
        showToast('Add at least 2 PDFs to merge', 'error');
        return;
    }
    
    showState('processing');
    setProgress(0);
    
    try {
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        
        let totalPages = 0;
        const fileCount = AppState.mergeFiles.length;
        
        for (let i = 0; i < fileCount; i++) {
            const file = AppState.mergeFiles[i];
            const sourcePdf = await PDFDocument.load(file.bytes);
            const pageCount = sourcePdf.getPageCount();
            
            const copiedPages = await mergedPdf.copyPages(sourcePdf, Array.from({ length: pageCount }, (_, i) => i));
            copiedPages.forEach(page => mergedPdf.addPage(page));
            
            totalPages += pageCount;
            setProgress(((i + 1) / fileCount) * 80);
        }
        
        processedPdfBytes = await mergedPdf.save();
        processedFileName = 'merged.pdf';
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${totalPages} pages</span><span>•</span><span>${fileCount} files merged</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Merge complete!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('Merge error:', error);
        showError('Failed to merge PDFs: ' + error.message);
    }
}
