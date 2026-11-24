'use client'
import {
  FileText,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  CopyPlus,
  Trash2,
  ArrowUpDown,
  RefreshCcw,
  Eye,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, useRef, useMemo } from 'react'
import { formatBytes } from '@/lib/tools'

interface PreviewArtifact {
  url: string
  name: string
  size?: number
}

export default function PreviewPanel({
  files = [],
  toolId = 'split',
  config = {},
  onConfigChange,
  outputPreview,
}: {
  files?: File[]
  toolId?: string
  config?: Record<string, any>
  onConfigChange?: (c: Record<string, any>) => void
  outputPreview?: PreviewArtifact | null
}) {
  const [viewTab, setViewTab] = useState<'input' | 'output'>('input')
  const [blobUrls, setBlobUrls] = useState<string[]>([])

  // Memoize & clean up object URLs ONLY when `files` array changes — zero iframe reload flicker!
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setBlobUrls(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [files])

  // Auto-switch to output preview when a previewable PDF/image output arrives
  useEffect(() => {
    if (outputPreview && isPreviewableName(outputPreview.name)) {
      setViewTab('output')
    } else {
      setViewTab('input')
    }
  }, [outputPreview])

  const file = files.length > 0 ? files[0] : null
  const primaryBlobUrl = blobUrls[0] || ''

  if (files.length === 0 || !file) {
    return (
      <aside className="w-full md:flex-1 bg-canvas-grid md:border-l border-zinc-200 flex flex-col min-h-[340px] md:h-screen shrink-0 items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-[15px] font-bold text-zinc-900">
          Interactive Studio Canvas
        </h3>
        <p className="text-[12.5px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
          Upload a document on the left to inspect pages, toggle ranges visually, rotate scans, or verify processed output live.
        </p>
      </aside>
    )
  }

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0)
  const canPreviewOutput =
    !!outputPreview && isPreviewableName(outputPreview.name)

  const interactiveTools = ['delete', 'extract', 'rotate', 'split', 'organize']
  const usePageGrid =
    file.type === 'application/pdf' && interactiveTools.includes(toolId)

  return (
    <aside className="w-full md:flex-1 bg-white md:border-l border-t md:border-t-0 border-zinc-200 flex flex-col min-h-[540px] md:h-screen shrink-0">
      {/* Top Canvas Header */}
      <div className="h-[60px] px-4 md:px-6 border-b border-zinc-200 flex items-center justify-between gap-3 shrink-0 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-semibold text-zinc-900 truncate">
              {viewTab === 'output' && outputPreview
                ? outputPreview.name
                : files.length > 1
                ? `${files.length} Documents Loaded`
                : file.name}
            </h4>
            <p className="font-mono text-[10.5px] text-zinc-500">
              {viewTab === 'output' && outputPreview?.size
                ? `Processed Output • ${formatBytes(outputPreview.size)}`
                : `Input • ${formatBytes(totalBytes)}`}
            </p>
          </div>
        </div>

        {canPreviewOutput && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewTab('input')}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition-all ${
                viewTab === 'input'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Source
            </button>
            <button
              type="button"
              onClick={() => setViewTab('output')}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold inline-flex items-center gap-1 transition-all ${
                viewTab === 'output'
                  ? 'bg-[#0A0A0B] text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#FF4D00]" /> Output Preview
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 bg-canvas-grid relative overflow-hidden">
        {viewTab === 'output' && outputPreview && canPreviewOutput ? (
          outputPreview.name.toLowerCase().endsWith('.pdf') ? (
            <iframe
              src={`${outputPreview.url}#view=FitH`}
              className="absolute inset-0 w-full h-full border-none bg-zinc-100"
              title="Processed PDF Output Preview"
            />
          ) : (
            <div className="absolute inset-0 overflow-auto flex items-center justify-center p-8">
              <img
                src={outputPreview.url}
                alt={outputPreview.name}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-zinc-200 bg-white"
              />
            </div>
          )
        ) : toolId === 'merge' ? (
          <div className="absolute inset-0 overflow-y-auto flex flex-col gap-6 p-6">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="w-full h-[520px] shrink-0 border border-zinc-200 shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white"
              >
                <div className="bg-white px-4 py-2.5 text-[12.5px] font-semibold text-zinc-900 border-b border-zinc-200 flex justify-between items-center shrink-0">
                  <span className="truncate pr-4 flex items-center gap-2">
                    <span className="font-mono bg-[#0A0A0B] text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                    {formatBytes(f.size)}
                  </span>
                </div>
                <div className="flex-1 relative">
                  {blobUrls[i] && f.type === 'application/pdf' ? (
                    <iframe
                      src={`${blobUrls[i]}#view=FitH&toolbar=0`}
                      className="absolute inset-0 w-full h-full border-none"
                      title={`PDF Preview ${i + 1}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-zinc-400 text-sm bg-zinc-50">
                      Loading preview…
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : toolId === 'images_to_pdf' ? (
          <div className="absolute inset-0 overflow-y-auto p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="relative bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm aspect-[3/4] flex flex-col"
                >
                  <div className="absolute top-2.5 left-2.5 z-10 font-mono bg-[#0A0A0B] text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow">
                    #{i + 1}
                  </div>
                  <div className="flex-1 relative p-3 bg-zinc-50 flex items-center justify-center overflow-hidden">
                    {blobUrls[i] && (
                      <img
                        src={blobUrls[i]}
                        alt={`Slide ${i + 1}`}
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    )}
                  </div>
                  <div className="bg-white border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-600 truncate font-medium flex justify-between gap-2">
                    <span className="truncate">{f.name}</span>
                    <span className="font-mono text-zinc-400 shrink-0">
                      {formatBytes(f.size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : usePageGrid ? (
          <PdfPageGrid
            file={file}
            toolId={toolId}
            config={config}
            onConfigChange={onConfigChange}
          />
        ) : file.type === 'application/pdf' && primaryBlobUrl ? (
          <iframe
            src={`${primaryBlobUrl}#view=FitH`}
            className="absolute inset-0 w-full h-full border-none"
            title="PDF Studio Preview"
          />
        ) : file.type.startsWith('image/') && primaryBlobUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img
              src={primaryBlobUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-xl shadow-sm bg-white p-2 border border-zinc-200"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-400 text-sm">
            Preview unavailable for this document format
          </div>
        )}
      </div>
    </aside>
  )
}

function isPreviewableName(name: string): boolean {
  const lower = (name || '').toLowerCase()
  return (
    lower.endsWith('.pdf') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp')
  )
}

function PdfPageGrid({
  file,
  toolId,
  config,
  onConfigChange,
}: {
  file: File
  toolId: string
  config: Record<string, any>
  onConfigChange?: (c: Record<string, any>) => void
}) {
  const [pdf, setPdf] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [cols, setCols] = useState<2 | 3 | 4>(3)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''
    let loadingTask: any = null

    const loadPdf = async () => {
      setPdf(null)
      setLoadErr(null)
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        objectUrl = URL.createObjectURL(file)
        loadingTask = pdfjsLib.getDocument(objectUrl)
        const doc = await loadingTask.promise
        if (cancelled) return
        setPdf(doc)
        setNumPages(doc.numPages)
      } catch (err: any) {
        if (!cancelled) {
          setLoadErr(
            err?.name === 'PasswordException'
              ? 'This PDF is password-protected. Unlock it in Protect / Unlock PDF first.'
              : 'Unable to render interactive page thumbnails.'
          )
        }
      }
    }

    loadPdf()
    return () => {
      cancelled = true
      if (loadingTask?.destroy) loadingTask.destroy()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  // Initialize organize page_order when numPages loads
  useEffect(() => {
    if (
      toolId === 'organize' &&
      numPages > 0 &&
      onConfigChange &&
      !Array.isArray(config?.page_order)
    ) {
      onConfigChange({
        ...config,
        page_order: Array.from({ length: numPages }, (_, i) => ({
          page: i + 1,
          rotation: 0,
        })),
      })
    }
  }, [toolId, numPages])

  const selectedSet = useMemo(() => {
    const pages = new Set<number>()
    const spec = toolId === 'split' ? config?.ranges : config?.pages
    if (!spec || typeof spec !== 'string') return pages
    spec.split(',').forEach((raw) => {
      const part = raw.trim().toLowerCase()
      if (!part) return
      if (part.includes('-')) {
        const [l, r] = part.split('-')
        const start = l === '' ? 1 : parseInt(l, 10)
        const end = r === '' || r === 'end' ? numPages : parseInt(r, 10)
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= numPages) pages.add(i)
          }
        }
      } else {
        const p = part === 'end' ? numPages : parseInt(part, 10)
        if (!isNaN(p) && p >= 1 && p <= numPages) pages.add(p)
      }
    })
    return pages
  }, [config?.pages, config?.ranges, toolId, numPages])

  const commitSelected = (nextSet: Set<number>) => {
    if (!onConfigChange) return
    const sorted = Array.from(nextSet).sort((a, b) => a - b)
    const key = toolId === 'split' ? 'ranges' : 'pages'
    onConfigChange({
      ...config,
      ...(toolId === 'split' ? { mode: 'ranges' } : {}),
      [key]: sorted.join(', '),
    })
  }

  const togglePage = (p: number) => {
    const next = new Set(selectedSet)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    commitSelected(next)
  }

  const selectQuick = (kind: 'all' | 'odd' | 'even' | 'invert' | 'clear') => {
    const next = new Set<number>()
    for (let i = 1; i <= numPages; i++) {
      if (kind === 'all') next.add(i)
      else if (kind === 'odd' && i % 2 === 1) next.add(i)
      else if (kind === 'even' && i % 2 === 0) next.add(i)
      else if (kind === 'invert' && !selectedSet.has(i)) next.add(i)
    }
    commitSelected(next)
  }

  const handleRotatePage = (p: number, deg: number) => {
    if (!onConfigChange) return
    const rots = { ...(config?.rotations || {}) }
    rots[p] = ((rots[p] || 0) + deg) % 360
    onConfigChange({ ...config, rotations: rots })
  }

  // Organize mode handlers
  const organizeList: { page: number; rotation: number }[] = useMemo(() => {
    if (Array.isArray(config?.page_order)) return config.page_order
    return Array.from({ length: numPages }, (_, i) => ({
      page: i + 1,
      rotation: 0,
    }))
  }, [config?.page_order, numPages])

  const updateOrganize = (next: { page: number; rotation: number }[]) => {
    onConfigChange?.({ ...config, page_order: next })
  }

  if (loadErr) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-sm">
          <p className="text-[13px] font-semibold text-zinc-900 mb-1">
            Canvas Notice
          </p>
          <p className="text-[12px] text-zinc-500">{loadErr}</p>
        </div>
      </div>
    )
  }

  if (!pdf) {
    return (
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[12px] text-zinc-500">
        Rendering high-DPI page lightboard…
      </div>
    )
  }

  const gridClass =
    cols === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : cols === 4
      ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-2 lg:grid-cols-3'

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Interactive Lightboard Action Bar */}
      <div className="px-4 py-2.5 bg-white/95 backdrop-blur border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 shrink-0 z-10">
        <div className="flex flex-wrap items-center gap-1.5">
          {(toolId === 'extract' || toolId === 'delete' || toolId === 'split') && (
            <>
              <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-900 text-white">
                {selectedSet.size} / {numPages} Selected
              </span>
              {(['all', 'odd', 'even', 'invert', 'clear'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => selectQuick(k)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:border-zinc-900 text-[11px] font-semibold capitalize text-zinc-700"
                >
                  {k}
                </button>
              ))}
            </>
          )}

          {toolId === 'rotate' && (
            <span className="font-mono text-[11px] text-zinc-600">
              Click rotate icons on any page ({numPages} pages total)
            </span>
          )}

          {toolId === 'organize' && (
            <>
              <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-900 text-white">
                {organizeList.length} Pages in Sequence
              </span>
              <button
                type="button"
                onClick={() => updateOrganize([...organizeList].reverse())}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:border-zinc-900 text-[11px] font-semibold text-zinc-700 inline-flex items-center gap-1"
              >
                <ArrowUpDown className="w-3 h-3" /> Reverse
              </button>
              <button
                type="button"
                onClick={() =>
                  updateOrganize(
                    Array.from({ length: numPages }, (_, i) => ({
                      page: i + 1,
                      rotation: 0,
                    }))
                  )
                }
                className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:border-zinc-900 text-[11px] font-semibold text-zinc-700 inline-flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" /> Reset
              </button>
            </>
          )}
        </div>

        {/* Zoom / Grid Density Controls */}
        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
          <button
            type="button"
            onClick={() => setCols((c) => (c < 4 ? ((c + 1) as 2 | 3 | 4) : 4))}
            className="p-1 text-zinc-600 hover:text-zinc-900"
            title="Smaller thumbnails"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCols((c) => (c > 2 ? ((c - 1) as 2 | 3 | 4) : 2))}
            className="p-1 text-zinc-600 hover:text-zinc-900"
            title="Larger thumbnails"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Page Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {toolId === 'organize' ? (
          <div className={`grid ${gridClass} gap-5`}>
            {organizeList.map((item, idx) => (
              <div
                key={`org-${idx}-${item.page}`}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (dragIdx === null || dragIdx === idx) return
                  const next = [...organizeList]
                  const [moved] = next.splice(dragIdx, 1)
                  next.splice(idx, 0, moved)
                  updateOrganize(next)
                  setDragIdx(idx)
                }}
                onDragEnd={() => setDragIdx(null)}
                className={`cursor-grab active:cursor-grabbing transition-opacity ${
                  dragIdx === idx ? 'opacity-50' : ''
                }`}
              >
                <PdfPageThumbnail
                  doc={pdf}
                  pageNumber={item.page}
                  badgeText={`#${idx + 1} (src p.${item.page})`}
                  isSelected={false}
                  onToggle={() => {}}
                  toolId="organize"
                  rotation={item.rotation}
                  onRotate={(deg) => {
                    const next = [...organizeList]
                    next[idx] = {
                      ...next[idx],
                      rotation: (next[idx].rotation + deg) % 360,
                    }
                    updateOrganize(next)
                  }}
                  onDuplicate={() => {
                    const next = [...organizeList]
                    next.splice(idx + 1, 0, { ...next[idx] })
                    updateOrganize(next)
                  }}
                  onDelete={
                    organizeList.length > 1
                      ? () => {
                          const next = organizeList.filter((_, i) => i !== idx)
                          updateOrganize(next)
                        }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-5`}>
            {Array.from({ length: numPages }, (_, i) => {
              const pNum = i + 1
              const globalDeg =
                toolId === 'rotate' ? Number(config?.global_angle || 0) : 0
              const target = config?.target || 'all'
              const appliesGlobal =
                target === 'all' ||
                (target === 'even' && pNum % 2 === 0) ||
                (target === 'odd' && pNum % 2 === 1)
              const totalRot =
                (appliesGlobal ? globalDeg : 0) +
                Number(config?.rotations?.[pNum] || 0)

              return (
                <PdfPageThumbnail
                  key={pNum}
                  doc={pdf}
                  pageNumber={pNum}
                  isSelected={selectedSet.has(pNum)}
                  onToggle={() => togglePage(pNum)}
                  toolId={toolId}
                  rotation={totalRot}
                  onRotate={(deg) => handleRotatePage(pNum, deg)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PdfPageThumbnail({
  doc,
  pageNumber,
  badgeText,
  isSelected,
  onToggle,
  toolId,
  rotation = 0,
  onRotate,
  onDuplicate,
  onDelete,
}: {
  doc: any
  pageNumber: number
  badgeText?: string
  isSelected: boolean
  onToggle: () => void
  toolId: string
  rotation?: number
  onRotate?: (deg: number) => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let renderTask: any = null
    let active = true

    const renderPage = async () => {
      if (!doc || !canvasRef.current) return
      try {
        const page = await doc.getPage(pageNumber)
        if (!active || !canvasRef.current) return
        const viewport = page.getViewport({ scale: 0.9 })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return
        canvas.height = viewport.height
        canvas.width = viewport.width

        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
      } catch {
        // Cancelled or unmounted
      }
    }

    renderPage()
    return () => {
      active = false
      if (renderTask?.cancel) renderTask.cancel()
    }
  }, [doc, pageNumber])

  const isDelete = toolId === 'delete'
  const isRotate = toolId === 'rotate'
  const isOrganize = toolId === 'organize'
  const normRot = ((rotation % 360) + 360) % 360

  const selectedStyle = isDelete
    ? 'border-red-600 ring-2 ring-red-500/20'
    : 'border-[#0A0A0B] shadow-[4px_4px_0px_0px_#0A0A0B]'

  return (
    <div
      onClick={isRotate || isOrganize ? undefined : onToggle}
      className={`relative group flex flex-col items-center justify-between p-3 transition-all border-2 rounded-2xl overflow-hidden bg-white ${
        isSelected && !isRotate && !isOrganize
          ? selectedStyle
          : 'border-zinc-200 hover:border-zinc-400 shadow-sm'
      } ${isRotate || isOrganize ? '' : 'cursor-pointer'}`}
    >
      {/* Top Floating Controls for Rotate / Organize */}
      {(isRotate || isOrganize) && (
        <div className="w-full flex items-center justify-between gap-1 mb-2 z-10">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRotate?.(-90)
              }}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#0A0A0B] hover:text-white text-zinc-700 transition-colors"
              title="Rotate -90°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRotate?.(90)
              }}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#0A0A0B] hover:text-white text-zinc-700 transition-colors"
              title="Rotate +90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {normRot !== 0 && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FF4D00] text-white">
              {normRot}°
            </span>
          )}

          {isOrganize && (
            <div className="flex items-center gap-1">
              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate()
                  }}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors"
                  title="Duplicate page"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-red-600 hover:text-white text-zinc-700 transition-colors"
                  title="Remove page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rendered PDF Page Canvas */}
      <div className="w-full aspect-[3/4] flex items-center justify-center bg-zinc-50 rounded-xl overflow-hidden p-2 border border-zinc-100">
        <div
          className="transition-transform duration-300 flex items-center justify-center max-w-full max-h-full"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[240px] w-auto h-auto shadow-sm bg-white"
          />
        </div>
      </div>

      {/* Footer Label */}
      <div className="w-full mt-2.5 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold text-zinc-700">
          {badgeText || `Page ${pageNumber}`}
        </span>
        {isSelected && !isRotate && !isOrganize && (
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isDelete
                ? 'bg-red-600 text-white'
                : 'bg-[#0A0A0B] text-white'
            }`}
          >
            {isDelete ? 'DELETE' : 'SELECTED'}
          </span>
        )}
      </div>
    </div>
  )
}
