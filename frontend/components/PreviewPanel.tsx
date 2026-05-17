'use client'
import { FileIcon } from 'lucide-react'

export default function PreviewPanel({ file }: { file: File | null }) {
  if (!file) {
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
          <h4 className="text-[13px] font-semibold text-gray-900 truncate">{file.name}</h4>
          <p className="text-[12px] text-gray-500">{sizeMb} MB</p>
        </div>
      </div>
      <div className="flex-1 bg-gray-50 relative">
        {file.type === 'application/pdf' ? (
          <iframe 
            src={`${URL.createObjectURL(file)}#view=FitH&toolbar=0`} 
            className="absolute inset-0 w-full h-full border-none"
            title="PDF Preview"
          />
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
