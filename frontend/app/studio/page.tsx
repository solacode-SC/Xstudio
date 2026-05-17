'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import PreviewPanel from '@/components/PreviewPanel'
import UploadZone from '@/components/UploadZone'
import ToolConfig from '@/components/ToolConfig'
import { useState } from 'react'
import { processFile } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Download, Menu } from 'lucide-react'

function StudioContent() {
  const searchParams = useSearchParams()
  const toolId = searchParams.get('tool') || 'split'
  const toolName = toolId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [config, setConfig] = useState({})
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string, name: string, size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles])
  }
  const handleRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleProcess = async () => {
    if (files.length === 0) return
    setProcessing(true)
    setError(null)
    try {
      const res = await processFile(files, toolId, config)
      setResult({ url: res.download_url, name: res.filename, size: res.size_bytes })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const reset = () => {
    setFiles([])
    setResult(null)
    setError(null)
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen overflow-hidden">
      <Sidebar activeTool={toolId} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="w-full md:w-[450px] lg:w-[500px] flex flex-col md:h-screen overflow-y-auto shrink-0 relative shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <header className="h-[60px] border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-700 hover:text-gray-900" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors hidden md:block">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-gray-300 hidden md:block">|</span>
            <span className="text-[14px] font-semibold text-gray-900">{toolName}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={reset} className="text-[12px] md:text-[13px] font-medium text-gray-500 hover:text-gray-900">Cancel</button>
            <button 
              onClick={handleProcess}
              disabled={files.length === 0 || processing || !!result}
              className="bg-black text-white px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-[12px] md:text-[13px] font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Process ▶'}
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-2xl mx-auto w-full">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-[13px] border border-red-100">
              {error}
            </div>
          )}

          {!result ? (
            <>
              <div className="mb-6 flex items-center justify-center gap-2">
                 <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${files.length===0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>1. Upload</span>
                 <span className="w-4 h-px bg-gray-200"></span>
                 <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${files.length>0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>2. Configure</span>
              </div>
              <UploadZone onUpload={handleUpload} files={files} onRemove={handleRemove} acceptType={toolId === 'images_to_pdf' ? 'image' : 'pdf'} />
              {files.length > 0 && <ToolConfig toolId={toolId} onChange={setConfig} />}
            </>
          ) : (
            <div className="text-center pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle2 className="w-8 h-8 text-green-600" />
               </div>
               <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
               <p className="text-[14px] text-gray-500 mb-8">{result.name} ({(result.size/(1024*1024)).toFixed(2)} MB)</p>
               
               <a 
                 href={`http://127.0.0.1:8000${result.url}`} 
                 download
                 target="_blank"
                 rel="noreferrer"
                 className="flex items-center justify-center gap-2 w-full bg-black text-white py-3 rounded-xl text-[14px] font-medium hover:bg-gray-800 transition-colors mb-4"
               >
                 <Download className="w-4 h-4" /> Download File
               </a>
               
               <button onClick={reset} className="text-[13px] text-gray-500 hover:text-black font-medium underline-offset-4 hover:underline">
                 Process another file →
               </button>
            </div>
          )}
        </div>
      </main>

      <PreviewPanel file={files[0] || null} />
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="p-10 flex w-full justify-center text-gray-500 text-[14px]">Loading Studio...</div>}>
      <StudioContent />
    </Suspense>
  )
}
