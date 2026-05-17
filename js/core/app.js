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
// Processed PDF Storage (shared with tool files)
// ========================================
let processedPdfBytes = null;
let processedFileName = 'processed.pdf';

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

    // Close mobile toolbar drawer when changing state
    closeMobileToolbar();
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
            selectTool(AppState.currentTool);
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
    // Clean up images-to-pdf state
    if (typeof imagesToConvert !== 'undefined') {
        imagesToConvert = [];
    }
    showState('upload');
}

// ========================================
// Toolbar Handling
// ========================================
function initToolbar() {
    DOM.toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            
            // Tools that don't require a PDF to be loaded first
            const noDocRequired = ['merge', 'images-to-pdf', 'html-to-pdf'];
            
            // Don't allow tools if no PDF loaded (except those that don't need one)
            if (!AppState.pdfDocument && !noDocRequired.includes(tool)) {
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
    
    // Close mobile toolbar drawer after selection
    closeMobileToolbar();
    
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
    
    // Get content from tool-specific render functions (loaded from tools/*.js)
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
        // Format Conversion Tools
        case 'pdf-to-images':
            content = renderPdfToImagesTool();
            break;
        case 'images-to-pdf':
            content = renderImagesToPdfTool();
            break;
        case 'pdf-to-word':
            content = renderPdfToWordTool();
            break;
        case 'html-to-pdf':
            content = renderHtmlToPdfTool();
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

// ========================================
// Tool Event Listeners
// ========================================
function attachToolListeners(tool) {
    // Each tool has its own attach function in tools/*.js
    switch (tool) {
        case 'split':
            attachSplitListeners();
            break;
        case 'merge':
            attachMergeListeners();
            break;
        case 'compress':
            attachCompressListeners();
            break;
        case 'rotate':
            attachRotateListeners();
            break;
        case 'delete':
            attachDeleteListeners();
            break;
        case 'extract':
            attachExtractListeners();
            break;
        // Format Conversion Tools
        case 'pdf-to-images':
            attachPdfToImagesListeners();
            break;
        case 'images-to-pdf':
            attachImagesToPdfListeners();
            break;
        case 'pdf-to-word':
            attachPdfToWordListeners();
            break;
        case 'html-to-pdf':
            attachHtmlToPdfListeners();
            break;
    }
}

// ========================================
// Confirm Dialog
// ========================================
function showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
        <div class="confirm-dialog">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirm-actions">
                <button class="btn-secondary" id="confirmCancel">Cancel</button>
                <button class="btn-danger" id="confirmOk">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#confirmCancel').addEventListener('click', () => {
        overlay.remove();
    });
    overlay.querySelector('#confirmOk').addEventListener('click', () => {
        overlay.remove();
        onConfirm();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ========================================
// Error Handler
// ========================================
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
        
        // Escape: Close tool panel or mobile toolbar
        if (e.key === 'Escape') {
            if (document.getElementById('toolbar')?.classList.contains('mobile-open')) {
                closeMobileToolbar();
            } else if (!DOM.toolPanel.classList.contains('hidden')) {
                DOM.toolPanel.classList.add('hidden');
                DOM.actionHint.classList.remove('hidden');
                clearToolSelection();
            }
        }
        
        // Number keys 1-6: Select tools (skip if user is typing in an input)
        const tag = e.target.tagName.toLowerCase();
        const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (!e.metaKey && !e.ctrlKey && !e.altKey && !isEditable) {
            const tools = ['split', 'merge', 'compress', 'rotate', 'delete', 'download'];
            const num = parseInt(e.key);
            if (num >= 1 && num <= 6) {
                selectTool(tools[num - 1]);
            }
        }
    });
}

// ========================================
// Toolbar Resize & Expand Functionality
// ========================================
function initToolbarResize() {
    const toolbar = document.getElementById('toolbar');
    const resizeHandle = document.getElementById('toolbarResizeHandle');
    const expandToggle = document.getElementById('toolbarExpandToggle');
    
    if (!toolbar) return;
    
    // ===== Desktop Resize =====
    if (resizeHandle) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = toolbar.offsetWidth;
            resizeHandle.classList.add('active');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const diff = e.clientX - startX;
            const newWidth = Math.max(48, Math.min(200, startWidth + diff));
            
            toolbar.style.width = newWidth + 'px';
            
            // Add expanded class for wider toolbar
            if (newWidth > 100) {
                toolbar.classList.add('expanded');
            } else {
                toolbar.classList.remove('expanded');
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Save preference
                localStorage.setItem('toolbarWidth', toolbar.offsetWidth);
            }
        });
        
        // Restore saved width
        const savedWidth = localStorage.getItem('toolbarWidth');
        if (savedWidth) {
            const width = parseInt(savedWidth);
            toolbar.style.width = width + 'px';
            if (width > 100) {
                toolbar.classList.add('expanded');
            }
        }
        
        // Double-click to reset
        resizeHandle.addEventListener('dblclick', () => {
            toolbar.style.width = '';
            toolbar.classList.remove('expanded');
            localStorage.removeItem('toolbarWidth');
        });
    }
    
    // ===== Mobile Expand =====
    if (expandToggle) {
        expandToggle.addEventListener('click', () => {
            toolbar.classList.toggle('mobile-expanded');
            
            // Save state
            const isExpanded = toolbar.classList.contains('mobile-expanded');
            localStorage.setItem('toolbarMobileExpanded', isExpanded);
        });
        
        // Restore mobile state
        const wasMobileExpanded = localStorage.getItem('toolbarMobileExpanded') === 'true';
        if (wasMobileExpanded && window.innerWidth <= 768) {
            toolbar.classList.add('mobile-expanded');
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            toolbar.classList.remove('mobile-expanded');
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
// Mobile Menu Toggle
// ========================================
function initMobileMenu() {
    // Create backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'toolbar-backdrop';
    backdrop.id = 'toolbarBackdrop';
    document.querySelector('.app-container')?.prepend(backdrop);

    const menuBtn = document.getElementById('mobileMenuBtn');
    menuBtn?.addEventListener('click', () => {
        const toolbar = document.getElementById('toolbar');
        toolbar?.classList.toggle('mobile-open');
        backdrop.classList.toggle('visible');
    });

    backdrop.addEventListener('click', () => {
        closeMobileToolbar();
    });
}

function closeMobileToolbar() {
    document.getElementById('toolbar')?.classList.remove('mobile-open');
    document.getElementById('toolbarBackdrop')?.classList.remove('visible');
}

// ========================================
// Shared Utility: Base file name
// ========================================
function getBaseFileName() {
    if (!AppState.pdfFile) return 'document';
    return AppState.pdfFile.name.replace(/\.pdf$/i, '');
}

// ========================================
// Initialize Application
// ========================================
function init() {
    initUploadZone();
    initToolbar();
    initToolbarResize();
    initKeyboardShortcuts();
    initMobileMenu();
    showState('upload');
    
    console.log('📄 Xstudio initialized!');
}

// Start the app
init();
