import React from 'react'
import {
  Scissors,
  Layers,
  Archive,
  RotateCw,
  Trash2,
  Copy,
  Image,
  FileImage,
  FileText,
  LayoutGrid,
  Stamp,
  ShieldCheck,
} from 'lucide-react'

export function getToolIcon(id: string, className = 'w-5 h-5') {
  switch (id) {
    case 'merge':
      return <Layers className={className} />
    case 'split':
      return <Scissors className={className} />
    case 'compress':
      return <Archive className={className} />
    case 'organize':
      return <LayoutGrid className={className} />
    case 'extract':
      return <Copy className={className} />
    case 'delete':
      return <Trash2 className={className} />
    case 'rotate':
      return <RotateCw className={className} />
    case 'pdf_to_images':
      return <Image className={className} />
    case 'images_to_pdf':
      return <FileImage className={className} />
    case 'pdf_to_word':
      return <FileText className={className} />
    case 'watermark':
      return <Stamp className={className} />
    case 'protect':
      return <ShieldCheck className={className} />
    default:
      return <FileText className={className} />
  }
}
