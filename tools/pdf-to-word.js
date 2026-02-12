/**
 * PDF to Word Tool - Extract text and structure from PDF
 * Creates a downloadable DOCX or TXT file
 */

function renderPdfToWordTool() {
    const totalPages = AppState.pdfDocument?.numPages || 0;
    
    return `
        ${renderToolHeader('PDF to Word', `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
            </svg>
        `)}
        <div class="tool-panel-content">
            <div class="info-box" style="background: var(--bg-main); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">
                    <strong>Note:</strong> This extracts text content from your PDF. 
                    Complex formatting, images, and tables may not be preserved perfectly.
                </p>
            </div>
            
            <div class="form-group">
                <label class="form-label">Output Format</label>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="wordFormat" value="txt" checked>
                        <span class="radio-label">Plain Text (.txt)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="wordFormat" value="docx">
                        <span class="radio-label">Word Document (.docx)</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Options</label>
                <label class="checkbox-option">
                    <input type="checkbox" id="preserveLineBreaks" checked>
                    <span class="checkbox-label">Preserve line breaks</span>
                </label>
                <label class="checkbox-option">
                    <input type="checkbox" id="includePageNumbers" checked>
                    <span class="checkbox-label">Include page markers</span>
                </label>
            </div>
            
            <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
                <p style="font-size: 12px; color: var(--text-light); margin: 0;">Document has</p>
                <p style="font-size: 24px; font-weight: 600; color: var(--primary); margin: 4px 0;">${totalPages} pages</p>
            </div>
            
            <button class="btn-primary" id="pdfToWordBtn" style="width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                Extract Text
            </button>
        </div>
    `;
}

function attachPdfToWordListeners() {
    document.getElementById('pdfToWordBtn')?.addEventListener('click', processPdfToWord);
}

async function processPdfToWord() {
    const format = document.querySelector('input[name="wordFormat"]:checked').value;
    const preserveLineBreaks = document.getElementById('preserveLineBreaks').checked;
    const includePageNumbers = document.getElementById('includePageNumbers').checked;
    
    showState('processing');
    setProgress(0);
    
    try {
        const textContent = [];
        const numPages = AppState.pdfDocument.numPages;
        
        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
            const page = await AppState.pdfDocument.getPage(i);
            const content = await page.getTextContent();
            
            let pageText = '';
            let lastY = null;
            
            // Process text items
            for (const item of content.items) {
                if (item.str) {
                    // Check if we need a line break (Y position changed significantly)
                    if (preserveLineBreaks && lastY !== null) {
                        const yDiff = Math.abs(item.transform[5] - lastY);
                        if (yDiff > 5) {
                            pageText += '\n';
                        } else if (pageText && !pageText.endsWith(' ')) {
                            pageText += ' ';
                        }
                    }
                    
                    pageText += item.str;
                    lastY = item.transform[5];
                }
            }
            
            if (includePageNumbers) {
                textContent.push(`--- Page ${i} ---\n\n${pageText.trim()}`);
            } else {
                textContent.push(pageText.trim());
            }
            
            setProgress(Math.round((i / numPages) * 80));
        }
        
        const fullText = textContent.join('\n\n');
        
        setProgress(90);
        
        if (format === 'txt') {
            // Download as plain text
            downloadTextFile(fullText, getBaseFileName() + '.txt');
        } else {
            // Create DOCX using docx library or fallback
            await downloadAsDocx(fullText, textContent);
        }
        
        setProgress(100);
        
        const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
        DOM.successInfo.innerHTML = `<span>${numPages} pages</span><span>•</span><span>~${wordCount.toLocaleString()} words</span>`;
        
        setTimeout(() => {
            showState('success');
            showToast('Text extracted!', 'success');
        }, 300);
        
    } catch (error) {
        console.error('PDF to Word error:', error);
        showError('Failed to extract text: ' + error.message);
    }
}

function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function downloadAsDocx(fullText, pageTexts) {
    // Check if docx library is available
    if (typeof docx !== 'undefined') {
        try {
            const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
            
            const children = [];
            
            pageTexts.forEach((pageText, index) => {
                // Add page heading
                children.push(
                    new Paragraph({
                        text: `Page ${index + 1}`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 }
                    })
                );
                
                // Add page content
                const lines = pageText.replace(/^--- Page \d+ ---\n\n/, '').split('\n');
                lines.forEach(line => {
                    children.push(
                        new Paragraph({
                            children: [new TextRun(line)],
                            spacing: { after: 120 }
                        })
                    );
                });
            });
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children
                }]
            });
            
            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = getBaseFileName() + '.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
        } catch (e) {
            console.warn('DOCX creation failed, falling back to RTF:', e);
            downloadAsRtf(fullText);
        }
    } else {
        // Fallback: Create RTF (can be opened by Word)
        downloadAsRtf(fullText);
    }
}

function downloadAsRtf(text) {
    // Simple RTF format that Word can open
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fswiss Arial;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24
${text.replace(/\n/g, '\\par\n').replace(/[\\{}]/g, '\\$&')}
}`;
    
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getBaseFileName() + '.rtf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Downloaded as RTF (Word-compatible)', 'info');
}
