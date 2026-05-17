'use client'
import Sidebar from '@/components/Sidebar'
import ToolCard from '@/components/ToolCard'
import { Scissors, Layers, Archive, RotateCw, Trash2, Copy, Image, FileImage, FileText, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const tools = [
    { id: 'split', title: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion', icon: <Scissors className="w-6 h-6 text-gray-700" /> },
    { id: 'merge', title: 'Merge PDFs', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.', icon: <Layers className="w-6 h-6 text-gray-700" /> },
    { id: 'compress', title: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.', icon: <Archive className="w-6 h-6 text-gray-700" /> },
    { id: 'rotate', title: 'Rotate Pages', desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!', icon: <RotateCw className="w-6 h-6 text-gray-700" /> },
    { id: 'delete', title: 'Delete Pages', desc: 'Remove pages from a PDF document in a flash.', icon: <Trash2 className="w-6 h-6 text-gray-700" /> },
    { id: 'extract', title: 'Extract Pages', desc: 'Get a new document containing only the desired pages.', icon: <Copy className="w-6 h-6 text-gray-700" /> },
    { id: 'pdf_to_images', title: 'PDF → Images', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', icon: <Image className="w-6 h-6 text-gray-700" /> },
    { id: 'images_to_pdf', title: 'Images → PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', icon: <FileImage className="w-6 h-6 text-gray-700" /> },
    { id: 'pdf_to_word', title: 'PDF → Word', desc: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.', icon: <FileText className="w-6 h-6 text-gray-700" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      <Sidebar activeTool="home" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <header className="md:hidden h-[60px] border-b border-gray-200 px-4 flex items-center bg-white sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-700">
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-bold text-[15px] text-gray-900">Xstudio</span>
        </header>
        <div className="px-6 md:px-10 py-8 md:py-12 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">What do you need help with?</h1>
          <p className="text-gray-500 mb-10 text-sm">Upload your PDF and get started instantly. No account needed.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
