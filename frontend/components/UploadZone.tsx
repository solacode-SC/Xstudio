'use client'
import { useCallback, useState } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { UploadCloud, X, GripVertical } from 'lucide-react'

export default function UploadZone({ onUpload, files, onRemove, acceptType = 'pdf', multiple = true, onReorder }: { onUpload: (files: File[]) => void, files: File[], onRemove: (index: number) => void, acceptType?: 'pdf' | 'image', multiple?: boolean, onReorder?: (newFiles: File[]) => void }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles)
  }, [onUpload])

  const acceptConfig: Accept = acceptType === 'image' 
    ? { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }
    : { 'application/pdf': ['.pdf'] }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: acceptConfig,
    multiple
  })

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedIndex === null || draggedIndex === index || !onReorder) return
    
    const newFiles = [...files]
    const draggedItem = newFiles[draggedIndex]
    newFiles.splice(draggedIndex, 1)
    newFiles.splice(index, 0, draggedItem)
    
    onReorder(newFiles)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

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
            <div 
              key={`${file.name}-${i}`} 
              draggable={!!onReorder}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 border rounded-lg bg-white transition-all ${draggedIndex === i ? 'opacity-50 border-black shadow-sm' : 'border-gray-200'} ${onReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {onReorder && <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />}
                <span className="text-[13px] font-medium text-gray-700 truncate">{file.name}</span>
              </div>
              <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-gray-600 shrink-0 ml-3">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
