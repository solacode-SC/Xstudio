'use client'
import Link from 'next/link'
import { LayoutDashboard, Scissors, Layers, Archive, RotateCw, Trash2, Copy, Image, FileImage, FileText, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

export default function Sidebar({ activeTool, isOpen, onClose }: { activeTool: string, isOpen?: boolean, onClose?: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(true)

  const tools = [
    { id: 'split', title: 'Split PDF', icon: <Scissors className="w-[18px] h-[18px]" /> },
    { id: 'merge', title: 'Merge PDFs', icon: <Layers className="w-[18px] h-[18px]" /> },
    { id: 'compress', title: 'Compress PDF', icon: <Archive className="w-[18px] h-[18px]" /> },
    { id: 'rotate', title: 'Rotate Pages', icon: <RotateCw className="w-[18px] h-[18px]" /> },
    { id: 'delete', title: 'Delete Pages', icon: <Trash2 className="w-[18px] h-[18px]" /> },
    { id: 'extract', title: 'Extract Pages', icon: <Copy className="w-[18px] h-[18px]" /> },
    { id: 'pdf_to_images', title: 'PDF → Images', icon: <Image className="w-[18px] h-[18px]" /> },
    { id: 'images_to_pdf', title: 'Images → PDF', icon: <FileImage className="w-[18px] h-[18px]" /> },
    { id: 'pdf_to_word', title: 'PDF → Word', icon: <FileText className="w-[18px] h-[18px]" /> },
  ]

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40" 
          onClick={onClose}
        />
      )}

      <aside className={`w-[220px] bg-white border-r border-gray-200 flex flex-col h-screen shrink-0 fixed md:relative z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1 rounded">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-[15px]">Xstudio</span>
          </div>
          <button className="md:hidden text-gray-400 hover:text-gray-600" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="mb-4">
            <div className="px-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-gray-400">Menu</div>
            <Link href="/" onClick={() => { if(window.innerWidth < 768 && onClose) onClose() }}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${activeTool === 'home' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                <LayoutDashboard className="w-[18px] h-[18px]" />
                <span>Studio</span>
              </div>
            </Link>
            
            <div className="mt-1">
              <div 
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-[18px] h-[18px]" />
                  <span>PDF Tools</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? '' : '-rotate-90'}`} />
              </div>
              
              {dropdownOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-gray-100 flex flex-col gap-1">
                  {tools.map(tool => (
                    <Link key={tool.id} href={`/studio?tool=${tool.id}`} onClick={() => { if(window.innerWidth < 768 && onClose) onClose() }}>
                      <div className={`px-3 py-1.5 rounded-md text-[12px] transition-colors ${activeTool === tool.id ? 'font-semibold text-black bg-gray-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                        {tool.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
