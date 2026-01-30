/**
 * PDF Editor - Simple & Fast
 * Upload, Process, Download - Nothing More
 */

// ========================================
// PDF.js Configuration
// ========================================
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ========================================
// Application State
// ========================================
const AppState = {
    currentTool: null,
    pdfFile: null,
    pdfDocument: null,
    pdfBytes: null,
    pages: [],
    selectedPages: new Set(),
    mergeFiles: [],
    isProcessing: false,
    
    reset() {
        this.currentTool = null;
        this.pdfFile = null;
        this.pdfDocument = null;
        this.pdfBytes = null;
        this.pages = [];
        this.selectedPages.clear();
        this.mergeFiles = [];
        this.isProcessing = false;
    }
};

// ========================================
// DOM Elements
// ========================================
const DOM = {
    // Main areas
    uploadZone: document.getElementById('uploadZone'),
    workspaceContainer: document.getElementById('workspaceContainer'),
    fileInput: document.getElementById('fileInput'),
    previewContainer: document.getElementById('previewContainer'),
    thumbnailsGrid: document.getElementById('thumbnailsGrid'),
    pagesScroll: document.getElementById('pagesScroll'),
    toolPanel: document.getElementById('toolPanel'),
    processingOverlay: document.getElementById('processingOverlay'),
    successContainer: document.getElementById('successContainer'),
    errorContainer: document.getElementById('errorContainer'),
    
    // Header
    headerUploadBtn: document.getElementById('headerUploadBtn'),
    
    // File info
    fileName: document.getElementById('fileName'),
    fileMeta: document.getElementById('fileMeta'),
    clearBtn: document.getElementById('clearBtn'),
    actionHint: document.getElementById('actionHint'),
    
    // Success/Error
    successInfo: document.getElementById('successInfo'),
    downloadBtn: document.getElementById('downloadBtn'),
    processAnother: document.getElementById('processAnother'),
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    goBackBtn: document.getElementById('goBackBtn'),
    
    // Progress
    progressFill: document.getElementById('progressFill'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer'),
    
    // Toolbar
    toolbar: document.getElementById('toolbar'),
    toolBtns: document.querySelectorAll('.tool-btn')
};

// ========================================
// Utility Functions
// ========================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function truncateFileName(name, maxLength = 30) {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.slice(0, -(ext.length + 1));
    const truncated = nameWithoutExt.slice(0, maxLength - ext.length - 4);
    return `${truncated}...${ext}`;
}

function showToast(message, type = 'info') {
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-message">${message}</div>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// State Management
// ========================================
function showState(stateName) {
    // Hide all states
    DOM.uploadZone.classList.add('hidden');
    DOM.workspaceContainer.classList.add('hidden');
    DOM.toolPanel.classList.add('hidden');
    DOM.processingOverlay.classList.add('hidden');
    DOM.successContainer.classList.add('hidden');
    DOM.errorContainer.classList.add('hidden');
    
    // Show requested state
    switch (stateName) {
        case 'upload':
            DOM.uploadZone.classList.remove('hidden');
            break;
        case 'preview':
            DOM.workspaceContainer.classList.remove('hidden');
            break;
        case 'tool':
            DOM.workspaceContainer.classList.remove('hidden');
            DOM.toolPanel.classList.remove('hidden');
            break;
        case 'processing':
            DOM.processingOverlay.classList.remove('hidden');
            break;
        case 'success':
            DOM.successContainer.classList.remove('hidden');
            break;
        case 'error':
            DOM.errorContainer.classList.remove('hidden');
            break;
    }
}

function setProgress(percent) {
    DOM.progressFill.style.width = `${percent}%`;
}

// ========================================
// Upload Handling
// ========================================
function initUploadZone() {
    // Click to upload
    DOM.uploadZone.addEventListener('click', () => {
        DOM.fileInput.click();
    });
    
    // Header upload button
    DOM.headerUploadBtn?.addEventListener('click', () => {
        DOM.fileInput.click();
    });
    
    // File input change
    DOM.fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // Drag and drop
    DOM.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.uploadZone.classList.add('drag-over');
    });
    
    DOM.uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        DOM.uploadZone.classList.remove('drag-over');
    });
    
    DOM.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.uploadZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                handleFileUpload(file);
            } else {
                showToast('Please upload a PDF file', 'error');
            }
        }
    });
    
    // Clear button
    DOM.clearBtn.addEventListener('click', () => {
        resetApp();
    });
    
    // Process another
    DOM.processAnother.addEventListener('click', (e) => {
        e.preventDefault();
        resetApp();
    });
    
    // Go back
    DOM.goBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showState('preview');
    });
    
    // Retry
    DOM.retryBtn.addEventListener('click', () => {
        if (AppState.currentTool) {
            processTool(AppState.currentTool);
        }
    });
}

async function handleFileUpload(file) {
    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
        showToast('File size exceeds 50MB limit', 'error');
        return;
    }
    
    // Validate file type
    if (file.type !== 'application/pdf') {
        showToast('Please upload a PDF file', 'error');
        return;
    }
    
    try {
        AppState.pdfFile = file;
        AppState.pdfBytes = await file.arrayBuffer();
        
        // Load PDF document (pass a copy to avoid buffer detachment)
        const loadingTask = pdfjsLib.getDocument({ data: AppState.pdfBytes.slice(0) });
        AppState.pdfDocument = await loadingTask.promise;
        
        // Update file info
        DOM.fileName.textContent = truncateFileName(file.name);
        DOM.fileName.title = file.name;
        DOM.fileMeta.textContent = `${formatFileSize(file.size)} • ${AppState.pdfDocument.numPages} pages`;
        
        // Render thumbnails
        await renderThumbnails();
        
        // Show preview
        showState('preview');
        showToast('PDF loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        showToast('Failed to load PDF. File may be corrupted.', 'error');
    }
}

async function renderThumbnails() {
    DOM.thumbnailsGrid.innerHTML = '';
    AppState.pages = [];
    
    const numPages = AppState.pdfDocument.numPages;
    
    for (let i = 1; i <= numPages; i++) {
        const page = await AppState.pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        // Create page element (vertical layout)
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        pageItem.dataset.page = i;
        pageItem.innerHTML = `
            <div class="page-checkbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="page-number">Page ${i} of ${numPages}</div>
        `;
        pageItem.insertBefore(canvas, pageItem.firstChild);
        
        // Click to select
        pageItem.addEventListener('click', () => {
            togglePageSelection(i);
        });
        
        DOM.thumbnailsGrid.appendChild(pageItem);
        AppState.pages.push({ pageNum: i, canvas });
    }
}

function togglePageSelection(pageNum) {
    if (AppState.selectedPages.has(pageNum)) {
        AppState.selectedPages.delete(pageNum);
    } else {
        AppState.selectedPages.add(pageNum);
    }
    updateThumbnailSelection();
}

function updateThumbnailSelection() {
    document.querySelectorAll('.page-item').forEach(item => {
        const pageNum = parseInt(item.dataset.page);
        if (AppState.selectedPages.has(pageNum)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectAllPages() {
    for (let i = 1; i <= AppState.pdfDocument.numPages; i++) {
        AppState.selectedPages.add(i);
    }
    updateThumbnailSelection();
}

function deselectAllPages() {
    AppState.selectedPages.clear();
    updateThumbnailSelection();
}

function resetApp() {
    AppState.reset();
    processedPdfBytes = null;
    processedFileName = 'processed.pdf';
    DOM.fileInput.value = '';
    DOM.thumbnailsGrid.innerHTML = '';
    clearToolSelection();
    showState('upload');
}

// ========================================
// Toolbar Handling
// ========================================
function initToolbar() {
    DOM.toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            
            // Don't allow tools if no PDF loaded
            if (!AppState.pdfDocument && tool !== 'merge') {
                showToast('Please upload a PDF first', 'info');
                return;
            }
            
            selectTool(tool);
        });
    });
}

function selectTool(tool) {
    // Clear previous selection
    clearToolSelection();
    
    // Select new tool
    const btn = document.querySelector(`[data-tool="${tool}"]`);
    if (btn) {
        btn.classList.add('active');
    }
    
    AppState.currentTool = tool;
    
    // Handle tool
    if (tool === 'download') {
        if (AppState.pdfFile) {
            downloadPDF();
        } else {
            showToast('No PDF to download', 'info');
        }
    } else {
        renderToolPanel(tool);
    }
}

function clearToolSelection() {
    DOM.toolBtns.forEach(btn => btn.classList.remove('active'));
    AppState.currentTool = null;
}

// ========================================
// Tool Panel Rendering
// ========================================
function renderToolHeader(title, iconContent, iconStyle = '') {
    return `
        <div class="tool-panel-header">
            <div class="tool-header-left">
                <div class="tool-panel-icon" style="${iconStyle}">
                    ${iconContent}
                </div>
                <h3 class="tool-panel-title">${title}</h3>
            </div>
            <button class="tool-close-btn" aria-label="Close tool">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
}

function renderToolPanel(tool) {
    let content = '';
    
    switch (tool) {
        case 'split':
            content = renderSplitTool();
            break;
        case 'merge':
            content = renderMergeTool();
            break;
        case 'compress':
            content = renderCompressTool();
            break;
        case 'rotate':
            content = renderRotateTool();
            break;
        case 'delete':
            content = renderDeleteTool();
            break;
        case 'extract':
            content = renderExtractTool();
            break;
    }
    
    DOM.toolPanel.innerHTML = content;
    DOM.toolPanel.classList.remove('hidden');
    DOM.actionHint.classList.add('hidden');
    
    // Attach close listener
    const closeBtn = DOM.toolPanel.querySelector('.tool-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearToolSelection();
            showState('preview');
        });
    }

    // Attach tool-specific listeners
    attachToolListeners(tool);
}

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

function renderDeleteTool() {
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

// ========================================
// Tool Event Listeners
// ========================================
function attachToolListeners(tool) {
    switch (tool) {
        case 'split':
            document.getElementById('splitBtn')?.addEventListener('click', processSplit);
            break;
            
        case 'merge':
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
            break;
            
        case 'compress':
            document.getElementById('qualitySlider')?.addEventListener('input', (e) => {
                const estimates = ['~60%', '~40%', '~20%'];
                document.getElementById('reductionEstimate').textContent = estimates[e.target.value - 1];
            });
            document.getElementById('compressBtn')?.addEventListener('click', processCompress);
            break;
            
        case 'rotate':
            document.querySelectorAll('.rotate-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const rotation = parseInt(btn.dataset.rotation);
                    processRotate(rotation);
                });
            });
            break;
            
        case 'delete':
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
            document.getElementById('deleteBtn')?.addEventListener('click', processDelete);
            break;

        case 'extract':
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
            break;
    }
}

// ========================================
// Tool Processing Functions
// ========================================

// Store processed PDF bytes
let processedPdfBytes = null;
let processedFileName = 'processed.pdf';

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
        // Sort them to match document order, or keep selection order? 
        // Usually logical order (1, 2, 5) is better than selection order (5, 1, 2)
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

function showError(message) {
    DOM.errorText.textContent = message;
    showState('error');
    showToast('An error occurred', 'error');
}

function downloadPDF() {
    // Check if we have processed bytes or original bytes
    let bytesToDownload = processedPdfBytes;
    
    // If no processed bytes, try to use original bytes
    if (!bytesToDownload && AppState.pdfBytes) {
        // Ensure valid buffer
        if (AppState.pdfBytes.byteLength > 0) {
            bytesToDownload = new Uint8Array(AppState.pdfBytes);
        }
    }
    
    const fileName = processedPdfBytes ? processedFileName : (AppState.pdfFile?.name || 'document.pdf');
    
    if (!bytesToDownload || bytesToDownload.length === 0) {
        showToast('Error: No PDF data available to download', 'error');
        console.error('Download failed: Buffer is empty or null');
        return;
    }
    
    try {
        const blob = new Blob([bytesToDownload], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Download started!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download PDF', 'error');
    }
}

// ========================================
// Keyboard Shortcuts
// ========================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + O: Open file
        if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
            e.preventDefault();
            DOM.fileInput.click();
        }
        
        // Cmd/Ctrl + D: Download
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            e.preventDefault();
            if (AppState.pdfFile) {
                downloadPDF();
            }
        }
        
        // Escape: Close tool panel
        if (e.key === 'Escape') {
            if (!DOM.toolPanel.classList.contains('hidden')) {
                DOM.toolPanel.classList.add('hidden');
                DOM.actionHint.classList.remove('hidden');
                clearToolSelection();
            }
        }
        
        // Number keys 1-6: Select tools
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            const tools = ['split', 'merge', 'compress', 'rotate', 'delete', 'download'];
            const num = parseInt(e.key);
            if (num >= 1 && num <= 6) {
                selectTool(tools[num - 1]);
            }
        }
    });
}

// ========================================
// Download Button Handler
// ========================================
DOM.downloadBtn?.addEventListener('click', () => {
    downloadPDF();
});

// ========================================
// Initialize Application
// ========================================
function init() {
    initUploadZone();
    initToolbar();
    initKeyboardShortcuts();
    showState('upload');
    
    console.log('📄 PDF Editor initialized!');
}

// Start the app
init();
