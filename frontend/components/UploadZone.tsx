'use client'
import { useCallback, useState } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import {
  UploadCloud,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Plus,
  ArrowDownAZ,
  ArrowUpDown,
} from 'lucide-react'
import { formatBytes } from '@/lib/tools'

export default function UploadZone({
  onUpload,
  files,
  onRemove,
  acceptType = 'pdf',
  multiple = true,
  onReorder,
}: {
  onUpload: (files: File[]) => void
  files: File[]
  onRemove: (index: number) => void
  acceptType?: 'pdf' | 'image'
  multiple?: boolean
  onReorder?: (newFiles: File[]) => void
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles)
      }
    },
    [onUpload]
  )

  const acceptConfig: Accept =
    acceptType === 'image'
      ? {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
        }
      : { 'application/pdf': ['.pdf'] }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: acceptConfig,
    multiple,
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

  const handleDragEnd = () => setDraggedIndex(null)

  const moveItem = (index: number, delta: number) => {
    if (!onReorder) return
    const target = index + delta
    if (target < 0 || target >= files.length) return
    const next = [...files]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onReorder(next)
  }

  const sortAlphabetically = () => {
    if (!onReorder) return
    onReorder([...files].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const reverseOrder = () => {
    if (!onReorder) return
    onReorder([...files].reverse())
  }

  return (
    <div className="w-full">
      {files.length === 0 ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-[#FF4D00] bg-orange-50/40'
              : 'border-zinc-300 bg-zinc-50/60 hover:border-[#0A0A0B] hover:bg-white'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mb-3.5 shadow-sm">
            <UploadCloud className="w-6 h-6 text-[#0A0A0B]" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-[#0A0A0B] mb-1">
            {acceptType === 'image'
              ? 'Drop high-resolution images here'
              : multiple
              ? 'Drop PDF documents to combine'
              : 'Drop your PDF document here'}
          </h3>
          <p className="text-[12px] text-zinc-500 mb-5 max-w-xs">
            {acceptType === 'image'
              ? 'Supports PNG, JPG & WebP • Up to 100MB per image'
              : '100% private ephemeral processing • Up to 100MB'}
          </p>
          <span className="bg-[#0A0A0B] text-white px-5 py-2.5 rounded-xl text-[12.5px] font-semibold shadow-sm">
            Select {multiple ? 'Files' : 'File'}
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Compact header bar above file list */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {files.length} {files.length === 1 ? 'File' : 'Files'} Ready (
              {formatBytes(files.reduce((acc, f) => acc + f.size, 0))})
            </span>
            <div className="flex items-center gap-1.5">
              {onReorder && files.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={sortAlphabetically}
                    title="Sort A-Z"
                    className="px-2 py-1 rounded-lg border border-zinc-200 bg-white text-[11px] font-medium text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 inline-flex items-center gap-1"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5" /> A–Z
                  </button>
                  <button
                    type="button"
                    onClick={reverseOrder}
                    title="Reverse order"
                    className="px-2 py-1 rounded-lg border border-zinc-200 bg-white text-[11px] font-medium text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 inline-flex items-center gap-1"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" /> Reverse
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={open}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-800 inline-flex items-center gap-1"
              >
                <input {...getInputProps()} />
                <Plus className="w-3.5 h-3.5" />
                {multiple ? 'Add More' : 'Replace'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-0.5">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${file.size}-${i}`}
                draggable={!!onReorder}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-2.5 border rounded-xl bg-white transition-all ${
                  draggedIndex === i
                    ? 'opacity-50 border-[#FF4D00] shadow-sm'
                    : 'border-zinc-200 hover:border-zinc-300'
                } ${onReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {onReorder && (
                    <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                  <span className="font-mono text-[10px] font-bold w-5 h-5 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-zinc-900 truncate">
                      {file.name}
                    </p>
                    <p className="font-mono text-[10.5px] text-zinc-400">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {onReorder && files.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => moveItem(i, -1)}
                        disabled={i === 0}
                        className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-25"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(i, 1)}
                        disabled={i === files.length - 1}
                        className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-25"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
