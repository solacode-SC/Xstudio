'use client'
import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Menu,
  Play,
  RotateCcw,
  Sparkles,
  Eye,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import PreviewPanel from '@/components/PreviewPanel'
import UploadZone from '@/components/UploadZone'
import ToolConfig from '@/components/ToolConfig'
import { getToolIcon } from '@/components/ToolIcon'
import { processFile, fetchResultAsFile } from '@/lib/api'
import { getToolById, STUDIO_TOOLS, formatBytes } from '@/lib/tools'
import { consumeHandoffFiles } from '@/lib/handoff'

function StudioContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawToolId = searchParams.get('tool') || 'merge'
  const tool = getToolById(rawToolId)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [config, setConfig] = useState<Record<string, any>>(tool.defaultConfig)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [activePreview, setActivePreview] = useState<{
    url: string
    name: string
    size?: number
  } | null>(null)
  const [chaining, setChaining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pick up quick-dropped files from Home hub if any
  useEffect(() => {
    const incoming = consumeHandoffFiles()
    if (incoming && incoming.length > 0) {
      setFiles(incoming)
    }
  }, [])

  // Reset tool-specific state cleanly when switching tools
  useEffect(() => {
    const nextTool = getToolById(rawToolId)
    setConfig({ ...nextTool.defaultConfig })
    setResult(null)
    setActivePreview(null)
    setError(null)
    setFiles((prev) => {
      if (prev.length === 0) return prev
      const compatible = prev.filter((f) =>
        nextTool.acceptType === 'image'
          ? f.type.startsWith('image/')
          : f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      )
      if (!nextTool.multiple && compatible.length > 1) {
        return [compatible[0]]
      }
      return compatible
    })
  }, [rawToolId])

  const handleUpload = (newFiles: File[]) => {
    setResult(null)
    setActivePreview(null)
    setError(null)
    if (tool.multiple) {
      setFiles((prev) => [...prev, ...newFiles])
    } else {
      setFiles(newFiles.slice(0, 1))
    }
  }

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setResult(null)
    setActivePreview(null)
  }

  const handleProcess = useCallback(async () => {
    if (files.length === 0 || processing) return
    setProcessing(true)
    setProgress(10)
    setError(null)

    try {
      const res = await processFile(files, tool.id, config, setProgress)
      if (res.type === 'multi_result') {
        setResult(res)
        const prefKey = res.preferred || 'medium'
        const prefObj = res.results?.[prefKey] || res.results?.medium
        if (prefObj) {
          setActivePreview({
            url: prefObj.url,
            name: prefObj.filename || `${prefObj.name}.pdf`,
            size: prefObj.size_bytes,
          })
        }
      } else {
        const single = {
          url: res.download_url,
          name: res.filename,
          size: res.size_bytes,
          originalSize: res.original_size_bytes,
          pageCount: res.page_count,
        }
        setResult(single)
        setActivePreview({
          url: single.url,
          name: single.name,
          size: single.size,
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process document.')
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }, [files, processing, tool.id, config])

  // Keyboard shortcut: Cmd/Ctrl + Enter to run
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (files.length > 0 && !processing && !result) {
          e.preventDefault()
          handleProcess()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [files.length, processing, result, handleProcess])

  const reset = () => {
    setFiles([])
    setConfig({ ...tool.defaultConfig })
    setResult(null)
    setActivePreview(null)
    setError(null)
  }

  const handleChainToTool = async (
    targetToolId: string,
    fileUrl: string,
    fileName: string
  ) => {
    setChaining(true)
    setError(null)
    try {
      const nextFile = await fetchResultAsFile(fileUrl, fileName)
      setFiles([nextFile])
      setResult(null)
      setActivePreview(null)
      router.push(`/studio?tool=${targetToolId}`)
    } catch (e: any) {
      setError(e.message || 'Could not load output into next tool.')
    } finally {
      setChaining(false)
    }
  }

  const singleOutputIsPdf =
    result &&
    !result.results &&
    typeof result.name === 'string' &&
    result.name.toLowerCase().endsWith('.pdf')

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen overflow-x-hidden bg-[#FAFAFA]">
      <Sidebar
        activeTool={tool.id}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Left Workbench Control Column */}
      <main className="w-full md:w-[440px] lg:w-[480px] flex flex-col md:h-screen overflow-y-auto shrink-0 bg-white relative z-10 border-b md:border-b-0 border-zinc-200">
        {/* Top Command Bar */}
        <header className="h-[60px] border-b border-zinc-200 px-4 md:px-5 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              className="md:hidden text-zinc-700 hover:text-zinc-900 p-1"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/"
              className="text-zinc-400 hover:text-[#0A0A0B] transition-colors hidden md:inline-flex p-1 rounded-lg hover:bg-zinc-100"
              title="Back to Studio Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-zinc-200 hidden md:inline">|</span>
            <span className="text-[#FF4D00] shrink-0">
              {getToolIcon(tool.id, 'w-4 h-4')}
            </span>
            <span className="font-display text-[15px] font-bold text-[#0A0A0B] truncate">
              {tool.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {files.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                title="Reset workspace"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleProcess}
              disabled={files.length === 0 || processing || !!result}
              className="bg-[#0A0A0B] text-white px-4 py-2 rounded-xl text-[12.5px] font-semibold hover:bg-[#FF4D00] disabled:opacity-40 disabled:hover:bg-[#0A0A0B] disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{processing ? 'Running…' : 'Process'}</span>
            </button>
          </div>
        </header>

        {/* Progress Bar */}
        {processing && (
          <div className="w-full h-1 bg-zinc-100 overflow-hidden shrink-0">
            <div
              className="h-full bg-[#FF4D00] transition-all duration-300"
              style={{ width: `${ Math.max(15, progress) }%` }}
            />
          </div>
        )}

        {/* Control Body */}
        <div className="flex-1 p-5 md:p-7 max-w-xl mx-auto w-full">
          {/* Tool Spec Header */}
          <div className="mb-5 flex items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
              {tool.code} • {tool.qualityBadge}
            </span>
            <span className="font-mono text-[10.5px] text-zinc-400 hidden sm:inline">
              ⌘ + ↵ to run
            </span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3.5 rounded-xl mb-5 text-[12.5px] border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <>
              <UploadZone
                onUpload={handleUpload}
                files={files}
                onRemove={handleRemove}
                acceptType={tool.acceptType}
                multiple={tool.multiple}
                onReorder={tool.multiple ? setFiles : undefined}
              />

              {files.length > 0 && (
                <>
                  <ToolConfig
                    toolId={tool.id}
                    value={config}
                    onChange={setConfig}
                  />

                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={processing}
                    className="mt-6 w-full py-3.5 px-5 rounded-2xl bg-[#0A0A0B] hover:bg-[#FF4D00] text-white font-display font-bold text-[14px] tracking-tight transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {processing
                        ? 'Processing High-Fidelity Output…'
                        : `Run ${tool.title}`}
                    </span>
                  </button>
                </>
              )}
            </>
          ) : result.type === 'multi_result' ? (
            /* 4-Tier Compression Result Matrix */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="p-4 rounded-2xl bg-zinc-950 text-white">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#FF4D00] font-semibold mb-1">
                  Optimization Complete
                </div>
                <h2 className="font-display text-[18px] font-bold">
                  Compare 4 Quality Tiers
                </h2>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Original size: {formatBytes(result.original_size_bytes)} •{' '}
                  {result.page_count} page{result.page_count === 1 ? '' : 's'}
                </p>
              </div>

              <div className="space-y-2.5">
                {['lossless', 'high', 'medium', 'low']
                  .map((k) => result.results?.[k])
                  .filter(Boolean)
                  .map((opt: any) => {
                    const isPref = result.preferred === opt.key
                    const isViewing = activePreview?.url === opt.url
                    return (
                      <div
                        key={opt.key}
                        className={`rounded-2xl p-4 border transition-all bg-white ${
                          isViewing
                            ? 'border-[#0A0A0B] shadow-[3px_3px_0px_0px_#0A0A0B]'
                            : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-[14px] text-zinc-900">
                                {opt.name}
                              </h4>
                              <span
                                className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  isPref
                                    ? 'bg-[#FF4D00] text-white'
                                    : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-zinc-500 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[13px] font-bold text-zinc-900">
                              {formatBytes(opt.size_bytes)}
                            </span>
                            {opt.savings_pct > 0 && (
                              <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                -{opt.savings_pct}%
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setActivePreview({
                                  url: opt.url,
                                  name: opt.filename,
                                  size: opt.size_bytes,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-[11.5px] font-semibold text-zinc-700 hover:border-zinc-900 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </button>
                            <a
                              href={opt.url}
                              download={opt.filename}
                              className="bg-[#0A0A0B] hover:bg-[#FF4D00] text-white px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null)
                    setActivePreview(null)
                  }}
                  className="text-[12.5px] font-semibold text-zinc-600 hover:text-zinc-950"
                >
                  ← Adjust Settings
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="text-[12.5px] font-semibold text-[#FF4D00] hover:underline"
                >
                  Process Another PDF →
                </button>
              </div>
            </div>
          ) : (
            /* Standard Artifact Output Card */
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="border-2 border-[#0A0A0B] rounded-2xl p-6 bg-white shadow-[4px_4px_0px_0px_#0A0A0B]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="font-mono text-[10.5px] uppercase tracking-wider text-emerald-700 font-semibold mb-1">
                  Artifact Ready
                </div>
                <h2 className="font-display text-[19px] font-bold text-zinc-900 break-all mb-3">
                  {result.name}
                </h2>

                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800">
                    Output: {formatBytes(result.size)}
                  </span>
                  {result.pageCount && (
                    <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800">
                      {result.pageCount} {result.pageCount === 1 ? 'Page' : 'Pages'}
                    </span>
                  )}
                  {result.originalSize > 0 && result.size < result.originalSize && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Saved{' '}
                      {Math.round(
                        (1 - result.size / result.originalSize) * 100
                      )}
                      %
                    </span>
                  )}
                </div>

                <a
                  href={result.url}
                  download={result.name}
                  className="flex items-center justify-center gap-2 w-full bg-[#0A0A0B] hover:bg-[#FF4D00] text-white py-3.5 rounded-xl text-[13.5px] font-bold transition-colors"
                >
                  <Download className="w-4 h-4" /> Download {result.name}
                </a>
              </div>

              {/* Pipeline Chaining: Continue editing output PDF in another tool */}
              {singleOutputIsPdf && (
                <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/80">
                  <div className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-zinc-500 mb-2.5 flex items-center justify-between">
                    <span>Continue Pipeline with Output PDF</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STUDIO_TOOLS.filter(
                      (t) => t.acceptType === 'pdf' && t.id !== tool.id
                    )
                      .slice(0, 6)
                      .map((nextTool) => (
                        <button
                          key={nextTool.id}
                          type="button"
                          disabled={chaining}
                          onClick={() =>
                            handleChainToTool(
                              nextTool.id,
                              result.url,
                              result.name
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 hover:border-[#0A0A0B] text-[11.5px] font-semibold text-zinc-800 transition-colors disabled:opacity-50"
                        >
                          → {nextTool.shortTitle}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null)
                    setActivePreview(null)
                  }}
                  className="text-[12.5px] font-semibold text-zinc-600 hover:text-zinc-950"
                >
                  ← Tweak Options
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="text-[12.5px] font-semibold text-[#FF4D00] hover:underline"
                >
                  Start Fresh →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Interactive Canvas & Live Output Verifier */}
      <PreviewPanel
        files={files}
        toolId={tool.id}
        config={config}
        onConfigChange={setConfig}
        outputPreview={activePreview}
      />
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex w-full min-h-screen items-center justify-center font-mono text-zinc-500 text-[13px]">
          Initializing Xstudio Workbench…
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  )
}
