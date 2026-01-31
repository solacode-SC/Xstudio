/**
 * HTML to PDF Tool - Convert HTML content or URL to PDF
 * Uses html2canvas for rendering
 */

function renderHtmlToPdfTool() {
    return `
        ${renderToolHeader('HTML to PDF', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="form-group">
                <label class="form-label">Input Type</label>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="htmlInputType" value="code" checked>
                        <span class="radio-label">HTML Code</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="htmlInputType" value="url">
                        <span class="radio-label">URL (same-origin)</span>
                    </label>
                </div>
            </div>
            
            <div id="htmlCodeInput">
                <div class="form-group">
                    <label class="form-label">HTML Content</label>
                    <textarea class="form-textarea" id="htmlContent" rows="8" placeholder="<html>
<head>
  <style>
    body { font-family: Arial; padding: 20px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is my PDF content.</p>
</body>
</html>"></textarea>
                </div>
            </div>
            
            <div id="htmlUrlInput" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Page URL</label>
                    <input type="url" class="form-input" id="htmlUrl" placeholder="https://example.com/page">
                    <p style="font-size: 11px; color: var(--text-light); margin-top: 4px;">
                        Note: Only same-origin URLs work due to browser security
                    </p>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Page Size</label>
                <select class="form-input" id="htmlPageSize">
                    <option value="a4">A4 (210 × 297 mm)</option>
                    <option value="letter">Letter (8.5 × 11 in)</option>
                    <option value="auto">Auto (fit content)</option>
                </select>
            </div>
            
            <button class="btn-primary" id="htmlToPdfBtn" style="width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                Convert to PDF
            </button>
        </div>
    `;
}

function attachHtmlToPdfListeners() {
    // Toggle input type
    document.querySelectorAll('input[name="htmlInputType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const codeInput = document.getElementById('htmlCodeInput');
            const urlInput = document.getElementById('htmlUrlInput');
            
            if (e.target.value === 'code') {
                codeInput.style.display = 'block';
                urlInput.style.display = 'none';
            } else {
                codeInput.style.display = 'none';
                urlInput.style.display = 'block';
            }
        });
    });
    
    document.getElementById('htmlToPdfBtn')?.addEventListener('click', processHtmlToPdf);
}

async function processHtmlToPdf() {
    const inputType = document.querySelector('input[name="htmlInputType"]:checked').value;
    const pageSize = document.getElementById('htmlPageSize').value;
    
    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
        showToast('html2canvas library required. Add it to your page.', 'error');
        return;
    }
    
    showState('processing');
    setProgress(10);
    
    try {
        let container;
        
        if (inputType === 'code') {
            const htmlContent = document.getElementById('htmlContent').value.trim();
            if (!htmlContent) {
                showToast('Please enter HTML content', 'error');
                showState('tool');
                return;
            }
            
            // Create hidden container for rendering
            container = document.createElement('div');
            container.style.cssText = 'position: absolute; left: -9999px; top: 0; background: white;';
            
            // Set container width based on page size
            if (pageSize === 'a4') {
                container.style.width = '794px'; // A4 at 96 DPI
            } else if (pageSize === 'letter') {
                container.style.width = '816px'; // Letter at 96 DPI
            } else {
                container.style.width = '800px';
            }
            
            // Parse and inject HTML
            container.innerHTML = htmlContent;
            document.body.appendChild(container);
            
        } else {
            // URL mode - use iframe (same-origin only)
            const url = document.getElementById('htmlUrl').value.trim();
            if (!url) {
                showToast('Please enter a URL', 'error');
                showState('tool');
                return;
            }
            
            showToast('Loading URL...', 'info');
            container = await loadUrlInIframe(url);
        }
        
        setProgress(30);
        
        // Render to canvas using html2canvas
        const canvas = await html2canvas(container, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        setProgress(60);
        
        // Clean up
        if (inputType === 'code') {
            document.body.removeChild(container);
        }
        
        // Convert canvas to PDF
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        
        // Page dimensions
        const pageSizes = {
            a4: { width: 595.28, height: 841.89 },
            letter: { width: 612, height: 792 }
        };
        
        // Get image data
        const imgData = canvas.toDataURL('image/png');
        const imgBytes = await fetch(imgData).then(r => r.arrayBuffer());
        const pngImage = await pdfDoc.embedPng(imgBytes);
        
        setProgress(80);
        
        // Calculate pages needed
        const imgWidth = pngImage.width;
        const imgHeight = pngImage.height;
        
        let pageWidth, pageHeight;
        if (pageSize === 'auto') {
            // Scale to reasonable width, maintain aspect ratio
            pageWidth = 595.28; // A4 width
            pageHeight = (imgHeight / imgWidth) * pageWidth;
            
            // Single page with content
            const page = pdfDoc.addPage([pageWidth, Math.min(pageHeight, 14400)]); // Max height limit
            page.drawImage(pngImage, {
                x: 0,
                y: page.getHeight() - (imgHeight / imgWidth) * pageWidth,
                width: pageWidth,
                height: (imgHeight / imgWidth) * pageWidth
            });
        } else {
            // Paginate content across multiple pages
            const size = pageSizes[pageSize];
            pageWidth = size.width;
            pageHeight = size.height;
            
            const scale = pageWidth / imgWidth;
            const scaledHeight = imgHeight * scale;
            const pagesNeeded = Math.ceil(scaledHeight / pageHeight);
            
            for (let i = 0; i < pagesNeeded; i++) {
                const page = pdfDoc.addPage([pageWidth, pageHeight]);
                
                // Calculate which portion of the image to show
                const yOffset = pageHeight - scaledHeight + (i * pageHeight);
                
                page.drawImage(pngImage, {
                    x: 0,
                    y: yOffset,
                    width: pageWidth,
                    height: scaledHeight
                });
            }
        }
        
        processedPdfBytes = await pdfDoc.save();
        processedFileName = 'html_export.pdf';
        
        setProgress(100);
        
        DOM.successInfo.innerHTML = `<span>${pdfDoc.getPageCount()} page(s)</span><span>•</span><span>${formatFileSize(processedPdfBytes.length)}</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('PDF created!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('HTML to PDF error:', error);
        showError('Failed to convert HTML: ' + error.message);
    }
}

function loadUrlInIframe(url) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; height: 600px;';
        
        iframe.onload = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                resolve(doc.body);
            } catch (e) {
                document.body.removeChild(iframe);
                reject(new Error('Cannot access URL due to cross-origin restrictions'));
            }
        };
        
        iframe.onerror = () => {
            document.body.removeChild(iframe);
            reject(new Error('Failed to load URL'));
        };
        
        document.body.appendChild(iframe);
        iframe.src = url;
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
                reject(new Error('URL loading timeout'));
            }
        }, 10000);
    });
}
