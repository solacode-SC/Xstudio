'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  Menu,
  Search,
  Sparkles,
  UploadCloud,
  ShieldCheck,
  Zap,
  Cpu,
  X,
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ToolCard from '@/components/ToolCard'
import { STUDIO_TOOLS, CATEGORIES, ToolCategory } from '@/lib/tools'
import { setHandoffFiles } from '@/lib/handoff'

export default function Home() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [category, setCategory] = useState<'all' | ToolCategory>('all')
  const [query, setQuery] = useState('')
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const onQuickDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return
      const allImages = accepted.every((f) => f.type.startsWith('image/'))
      if (allImages) {
        setHandoffFiles(accepted)
        router.push('/studio?tool=images_to_pdf')
        return
      }
      if (accepted.length > 1) {
        setHandoffFiles(accepted)
        router.push('/studio?tool=merge')
        return
      }
      setDroppedFiles(accepted)
    },
    [router]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onQuickDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    noClick: false,
  })

  const launchWithDroppedFile = (toolId: string) => {
    setHandoffFiles(droppedFiles)
    router.push(`/studio?tool=${toolId}`)
  }

  const filteredTools = STUDIO_TOOLS.filter((tool) => {
    const matchesCategory = category === 'all' || tool.category === category
    const q = query.trim().toLowerCase()
    const matchesQuery =
      !q ||
      tool.title.toLowerCase().includes(q) ||
      tool.desc.toLowerCase().includes(q) ||
      tool.qualityBadge.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-studio-grid">
      <Sidebar
        activeTool="home"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-[60px] border-b border-zinc-200 px-4 flex items-center justify-between bg-white/95 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-zinc-800 p-1 rounded-md hover:bg-zinc-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-display font-bold text-[16px] text-[#0A0A0B]">
              Xstudio
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-white">
            NO LOGIN
          </span>
        </header>

        <div className="px-5 sm:px-8 lg:px-12 py-8 md:py-12 max-w-6xl mx-auto">
          {/* Architectural Editorial Hero */}
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 lg:p-10 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#FF4D00]" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-800">
                    Precision PDF Architecture • Local-First Engine
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A0B] leading-[1.12] mb-3">
                  Studio-grade PDF tools,{' '}
                  <span className="underline decoration-[#FF4D00] decoration-[3px] underline-offset-4">
                    zero compromises.
                  </span>
                </h1>
                <p className="text-zinc-600 text-[14px] sm:text-[15px] leading-relaxed">
                  Lossless vector slicing, 4-tier Ghostscript compression, 600 DPI rasterization, layout-aware Word reconstruction, and AES-256 encryption — with zero sign-up and automatic 10-minute file wipe.
                </p>
              </div>

              {/* Spec Badges */}
              <div className="grid grid-cols-3 gap-2.5 shrink-0">
                <div className="border border-zinc-200 rounded-2xl px-3.5 py-3 bg-zinc-50/70">
                  <Zap className="w-4 h-4 text-[#FF4D00] mb-1" />
                  <div className="font-mono text-[13px] font-bold text-[#0A0A0B]">
                    600 DPI
                  </div>
                  <div className="text-[11px] text-zinc-500">Max Output</div>
                </div>
                <div className="border border-zinc-200 rounded-2xl px-3.5 py-3 bg-zinc-50/70">
                  <Cpu className="w-4 h-4 text-[#0A0A0B] mb-1" />
                  <div className="font-mono text-[13px] font-bold text-[#0A0A0B]">
                    100 MB
                  </div>
                  <div className="text-[11px] text-zinc-500">Per Document</div>
                </div>
                <div className="border border-zinc-200 rounded-2xl px-3.5 py-3 bg-zinc-50/70">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                  <div className="font-mono text-[13px] font-bold text-[#0A0A0B]">
                    10 MIN
                  </div>
                  <div className="text-[11px] text-zinc-500">Auto-Purge</div>
                </div>
              </div>
            </div>

            {/* Instant Drop-to-Launch Bar */}
            <div className="mt-7 pt-6 border-t border-zinc-100">
              {droppedFiles.length === 0 ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-[#FF4D00] bg-orange-50/50'
                      : 'border-zinc-200 bg-zinc-50/60 hover:border-[#0A0A0B] hover:bg-zinc-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex items-center gap-3.5 text-center sm:text-left">
                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
                      <UploadCloud className="w-5 h-5 text-[#0A0A0B]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0A0A0B]">
                        Quick Drop — Drag a PDF or images right here to jump straight into Studio
                      </p>
                      <p className="text-[12px] text-zinc-500">
                        Multiple PDFs auto-open Merge • Images auto-open Images → PDF • Single PDF lets you pick any tool
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-semibold px-3.5 py-2 rounded-xl bg-[#0A0A0B] text-white shrink-0">
                    Browse File →
                  </span>
                </div>
              ) : (
                <div className="border border-[#0A0A0B] rounded-2xl p-4 bg-zinc-950 text-white animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-[#FF4D00] shrink-0" />
                      <span className="text-[13px] font-semibold truncate">
                        Loaded: {droppedFiles[0].name} — Choose a tool to open directly:
                      </span>
                    </div>
                    <button
                      onClick={() => setDroppedFiles([])}
                      className="text-zinc-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STUDIO_TOOLS.filter((t) => t.acceptType === 'pdf').map((t) => (
                      <button
                        key={t.id}
                        onClick={() => launchWithDroppedFile(t.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#FF4D00] text-[12px] font-medium transition-colors"
                      >
                        {t.shortTitle}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Filter Tabs + Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => {
                const active = category === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-[12.5px] font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-[#0A0A0B] text-white shadow-sm'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools (⌘K)..."
                className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-12 py-2 text-[13px] text-[#0A0A0B] placeholder:text-zinc-400 focus:outline-none focus:border-[#0A0A0B] transition-colors"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* Tools Grid */}
          {filteredTools.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
              <p className="text-[14px] font-semibold text-zinc-800 mb-1">
                No matching PDF tools found
              </p>
              <p className="text-[12.5px] text-zinc-500 mb-4">
                Try clearing your search filter to view all 12 studio services.
              </p>
              <button
                onClick={() => {
                  setQuery('')
                  setCategory('all')
                }}
                className="px-4 py-2 rounded-xl bg-[#0A0A0B] text-white text-[12.5px] font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
