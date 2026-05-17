'use client'
import { FileIcon, RotateCw, RotateCcw } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

export default function PreviewPanel({ files = [], toolId, config, onConfigChange }: { files?: File[], toolId?: string, config?: any, onConfigChange?: (c: any) => void }) {
  const file = files.length > 0 ? files[0] : null;

  if (files.length === 0 || !file) {
    return (
      <aside className="w-full md:flex-1 bg-gray-50 md:border-l border-gray-200 flex flex-col min-h-[300px] md:h-screen shrink-0 items-center justify-center p-6 text-center">
        <FileIcon className="w-12 h-12 text-gray-300 mb-3" strokeWidth={1} />
        <h3 className="text-[14px] font-medium text-gray-700">No file selected</h3>
        <p className="text-[12px] text-gray-400 mt-1">Upload a PDF to see preview</p>
      </aside>
    )
  }

  const sizeMb = (file.size / (1024 * 1024)).toFixed(2)

  return (
    <aside className="w-full md:flex-1 bg-white md:border-l border-t md:border-t-0 border-gray-200 flex flex-col min-h-[500px] md:h-screen shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
          <FileIcon className="w-5 h-5 text-gray-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-semibold text-gray-900 truncate">
            {toolId === 'merge' || toolId === 'images_to_pdf' 
              ? `${files.length} File${files.length > 1 ? 's' : ''} Selected` 
              : file.name}
          </h4>
          <p className="text-[12px] text-gray-500">{sizeMb} MB</p>
        </div>
      </div>
      <div className="flex-1 bg-gray-50 relative">
        {toolId === 'merge' ? (
          <div className="absolute inset-0 overflow-y-auto bg-gray-100 flex flex-col gap-6 p-6">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="w-full h-[600px] shrink-0 border border-gray-200 shadow-md rounded-xl overflow-hidden flex flex-col bg-white">
                <div className="bg-white px-4 py-3 text-[13px] font-semibold text-gray-800 border-b border-gray-200 flex justify-between items-center shrink-0">
                  <span className="truncate pr-4 flex items-center gap-2">
                    <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">{i + 1}</span> 
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="text-gray-400 shrink-0">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex-1 relative">
                  {f.type === 'application/pdf' ? (
                    <iframe 
                      src={`${URL.createObjectURL(f)}#view=FitH&toolbar=0`} 
                      className="absolute inset-0 w-full h-full border-none"
                      title={`PDF Preview ${i + 1}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm bg-gray-50">Invalid PDF</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : toolId === 'images_to_pdf' ? (
          <div className="absolute inset-0 overflow-y-auto bg-gray-100 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm aspect-square flex flex-col">
                  <div className="absolute top-2 left-2 z-10 bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">{i + 1}</div>
                  <div className="flex-1 relative p-2 bg-gray-50">
                    <img src={URL.createObjectURL(f)} alt={`Preview ${i+1}`} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="bg-white border-t border-gray-100 px-2 py-1.5 text-[10px] text-gray-500 truncate text-center font-medium">
                    {f.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : file.type === 'application/pdf' ? (
          toolId === 'delete' || toolId === 'extract' || toolId === 'rotate' ? (
            <PdfPageGrid file={file} toolId={toolId} config={config} onConfigChange={onConfigChange} />
          ) : (
            <iframe 
              src={`${URL.createObjectURL(file)}#view=FitH&toolbar=0`} 
              className="absolute inset-0 w-full h-full border-none"
              title="PDF Preview"
            />
          )
        ) : file.type.startsWith('image/') ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded shadow-sm"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
            Preview not available for this file type
          </div>
        )}
      </div>
    </aside>
  )
}

function PdfPageGrid({ file, toolId, config, onConfigChange }: { file: File, toolId: string, config: any, onConfigChange?: (c: any) => void }) {
  const [pdf, setPdf] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        const url = URL.createObjectURL(file)
        const loadingTask = pdfjsLib.getDocument(url)
        const doc = await loadingTask.promise
        setPdf(doc)
        setNumPages(doc.numPages)
      } catch (err) {
        console.error("Failed to load PDF with pdfjs", err)
      }
    }
    loadPdf()
  }, [file])

  // Parse config.pages ("1,3,4-6")
  const getSelectedPages = () => {
    const pages = new Set<number>()
    const configStr = config?.pages || config?.ranges
    if (!configStr) return Array.from(pages)
    const parts = configStr.split(',')
    parts.forEach((part: string) => {
      part = part.trim()
      if (!part) return
      if (part.includes('-')) {
        const [s, e] = part.split('-')
        const start = parseInt(s)
        const end = parseInt(e)
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) pages.add(i)
        }
      } else {
        const p = parseInt(part)
        if (!isNaN(p)) pages.add(p)
      }
    })
    return Array.from(pages)
  }

  const selectedPages = getSelectedPages()

  const togglePage = (p: number) => {
    let current = new Set(selectedPages)
    if (current.has(p)) current.delete(p)
    else current.add(p)
    
    const sorted = Array.from(current).sort((a, b) => a - b)
    if (onConfigChange) {
      const key = toolId === 'split' ? 'ranges' : 'pages'
      onConfigChange({ ...config, [key]: sorted.join(', ') })
    }
  }

  const handleRotate = (p: number, deg: number) => {
    if (!onConfigChange) return
    const rots = { ...(config?.rotations || {}) }
    rots[p] = (rots[p] || 0) + deg
    onConfigChange({ ...config, rotations: rots })
  }

  if (!pdf) {
    return <div className="absolute inset-0 flex items-center justify-center text-[13px] text-gray-500">Loading document pages...</div>
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6 bg-gray-100">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: numPages }, (_, i) => (
          <PdfPageThumbnail 
            key={i} 
            doc={pdf} 
            pageNumber={i + 1} 
            isSelected={selectedPages.includes(i + 1)} 
            onToggle={() => togglePage(i + 1)} 
            toolId={toolId}
            rotation={config?.rotations?.[i + 1] || 0}
            onRotate={(deg) => handleRotate(i + 1, deg)}
          />
        ))}
      </div>
    </div>
  )
}

function PdfPageThumbnail({ doc, pageNumber, isSelected, onToggle, toolId, rotation = 0, onRotate }: { doc: any, pageNumber: number, isSelected: boolean, onToggle: () => void, toolId: string, rotation?: number, onRotate?: (deg: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    let renderTask: any = null
    const renderPage = async () => {
      if (!doc || !canvasRef.current) return
      try {
        const page = await doc.getPage(pageNumber)
        // scale based on device pixel ratio for sharpness, but keep it roughly thumbnail size
        const viewport = page.getViewport({ scale: 0.8 }) 
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
      } catch (e) {
        // Render cancelled or failed
      }
    }
    renderPage()
    return () => { if (renderTask) renderTask.cancel() }
  }, [doc, pageNumber])

  const isDelete = toolId === 'delete'
  const isRotate = toolId === 'rotate'
  const activeBorder = isDelete ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
  const activeBg = isDelete ? 'bg-red-500/20' : 'bg-blue-500/20'
  const iconBg = isDelete ? 'bg-red-500' : 'bg-blue-500'
  const badgeColor = isDelete ? 'text-red-600' : 'text-blue-600'
  const activeLabel = isDelete ? 'DELETED' : 'EXTRACT'

  return (
    <div 
      className={`relative group flex items-center justify-center p-2 transition-all border-[3px] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md ${isSelected && !isRotate ? `${activeBorder} opacity-80` : 'border-transparent hover:border-gray-300'}`}
      onClick={isRotate ? undefined : onToggle}
      style={isRotate ? { cursor: 'default' } : { cursor: 'pointer' }}
    >
      <div className="transition-transform duration-300 w-full flex items-center justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
        <canvas ref={canvasRef} className="max-w-full h-auto shadow-sm border border-gray-100" />
      </div>
      
      {isRotate && (
        <div className="absolute top-3 inset-x-0 flex justify-center gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onRotate?.(-90) }} className="bg-black/80 text-white p-2 rounded-full hover:bg-black shadow-lg backdrop-blur">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRotate?.(90) }} className="bg-black/80 text-white p-2 rounded-full hover:bg-black shadow-lg backdrop-blur">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-white text-[11px] font-medium px-2 py-1 rounded z-20">Page {pageNumber}</div>
      {isSelected && !isRotate && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${activeBg}`}>
          <div className={`${iconBg} text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg`}>
            {isDelete ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            )}
          </div>
          <span className={`${badgeColor} font-bold text-sm mt-2 bg-white px-2 py-0.5 rounded shadow`}>{activeLabel}</span>
        </div>
      )}
    </div>
  )
}
