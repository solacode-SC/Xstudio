'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X } from 'lucide-react'

export default function UploadZone({ onUpload, files, onRemove, acceptType = 'pdf' }: { onUpload: (files: File[]) => void, files: File[], onRemove: (index: number) => void, acceptType?: 'pdf' | 'image' }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles)
  }, [onUpload])

  const acceptConfig = acceptType === 'image' 
    ? { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }
    : { 'application/pdf': ['.pdf'] }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: acceptConfig
  })

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <UploadCloud className="w-6 h-6 text-gray-700" />
        </div>
        <h3 className="text-[14px] font-bold text-gray-900 mb-1">Upload Files</h3>
        <p className="text-[12px] text-gray-500 mb-6">
          {acceptType === 'image' ? 'Drop your images here or click to browse.' : 'Drop your PDF here or click to browse. Max 50MB.'}
        </p>
        <button type="button" className="bg-black text-white px-5 py-2 rounded-full text-[13px] font-medium hover:bg-gray-800 transition-colors pointer-events-none">
          Select Files
        </button>
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <span className="text-[13px] font-medium text-gray-700 truncate">{file.name}</span>
              <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
