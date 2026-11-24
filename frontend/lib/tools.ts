export type ToolCategory = 'organize' | 'optimize' | 'convert' | 'security'

export interface ToolDefinition {
  id: string
  code: string
  title: string
  shortTitle: string
  desc: string
  category: ToolCategory
  qualityBadge: string
  acceptType: 'pdf' | 'image'
  multiple: boolean
  interactiveGrid?: boolean
  defaultConfig: Record<string, any>
}

export const CATEGORIES: { id: 'all' | ToolCategory; label: string }[] = [
  { id: 'all', label: 'All Services' },
  { id: 'organize', label: 'Organize & Edit' },
  { id: 'optimize', label: 'Optimize' },
  { id: 'convert', label: 'Convert' },
  { id: 'security', label: 'Stamp & Security' },
]

export const STUDIO_TOOLS: ToolDefinition[] = [
  {
    id: 'merge',
    code: '01',
    title: 'Merge PDFs',
    shortTitle: 'Merge PDFs',
    desc: 'Combine multiple PDF documents in custom drag-and-drop sequence with automatic PDF bookmarks and lossless vector preservation.',
    category: 'organize',
    qualityBadge: 'LOSSLESS + TOC',
    acceptType: 'pdf',
    multiple: true,
    defaultConfig: { add_bookmarks: true, normalize_a4: false },
  },
  {
    id: 'split',
    code: '02',
    title: 'Split PDF',
    shortTitle: 'Split PDF',
    desc: 'Slice documents by custom ranges, fixed page intervals, or burst every page into individual lossless PDFs.',
    category: 'organize',
    qualityBadge: 'MULTI-MODE',
    acceptType: 'pdf',
    multiple: false,
    interactiveGrid: true,
    defaultConfig: { mode: 'ranges', ranges: '', every_n: 2, merge_ranges: false },
  },
  {
    id: 'compress',
    code: '03',
    title: 'Compress PDF',
    shortTitle: 'Compress PDF',
    desc: 'Generate 4 simultaneous optimization tiers — from 100% lossless stream deduplication to 300/180/110 DPI Ghostscript bicubic tuning.',
    category: 'optimize',
    qualityBadge: '4-TIER SMART GS',
    acceptType: 'pdf',
    multiple: false,
    defaultConfig: { quality: 'medium' },
  },
  {
    id: 'organize',
    code: '04',
    title: 'Organize Pages',
    shortTitle: 'Organize Pages',
    desc: 'Visually drag and drop pages to reorder, duplicate, rotate, or prune pages on an interactive studio lightboard.',
    category: 'organize',
    qualityBadge: 'VISUAL CANVAS',
    acceptType: 'pdf',
    multiple: false,
    interactiveGrid: true,
    defaultConfig: { page_order: null },
  },
  {
    id: 'extract',
    code: '05',
    title: 'Extract Pages',
    shortTitle: 'Extract Pages',
    desc: 'Cherry-pick pages visually or by range into a clean PDF or individual per-page files with zero quality loss.',
    category: 'organize',
    qualityBadge: 'LOSSLESS VECTOR',
    acceptType: 'pdf',
    multiple: false,
    interactiveGrid: true,
    defaultConfig: { pages: '', separate_files: false },
  },
  {
    id: 'delete',
    code: '06',
    title: 'Delete Pages',
    shortTitle: 'Delete Pages',
    desc: 'Click unwanted pages to strip them out instantly while purging unreferenced streams to shrink file size.',
    category: 'organize',
    qualityBadge: 'STREAM PURGE',
    acceptType: 'pdf',
    multiple: false,
    interactiveGrid: true,
    defaultConfig: { pages: '' },
  },
  {
    id: 'rotate',
    code: '07',
    title: 'Rotate Pages',
    shortTitle: 'Rotate Pages',
    desc: 'Fix sideways scans individually or batch-rotate all, odd, even, portrait, or landscape pages without re-encoding.',
    category: 'organize',
    qualityBadge: 'ZERO RE-ENCODE',
    acceptType: 'pdf',
    multiple: false,
    interactiveGrid: true,
    defaultConfig: { rotations: {}, global_angle: 0, target: 'all' },
  },
  {
    id: 'pdf_to_images',
    code: '08',
    title: 'PDF → Images',
    shortTitle: 'PDF → Images',
    desc: 'Render crisp pages into lossless PNG, 4:4:4 High-Quality JPG, or WebP at 150, 300, or Ultra-HD 600 DPI.',
    category: 'convert',
    qualityBadge: 'UP TO 600 DPI',
    acceptType: 'pdf',
    multiple: false,
    defaultConfig: { format: 'png', dpi: 300, pages: '' },
  },
  {
    id: 'images_to_pdf',
    code: '09',
    title: 'Images → PDF',
    shortTitle: 'Images → PDF',
    desc: 'Compile JPG, PNG, and WebP artwork onto print-ready A4, Letter, or borderless native-fit PDF pages with EXIF auto-rotation.',
    category: 'convert',
    qualityBadge: '300 DPI LANCZOS',
    acceptType: 'image',
    multiple: true,
    defaultConfig: { page_size: 'a4', orientation: 'auto', margin: 'small', dpi: 300 },
  },
  {
    id: 'pdf_to_word',
    code: '10',
    title: 'PDF → Word',
    shortTitle: 'PDF → Word',
    desc: 'Reconstruct editable DOCX documents preserving tables, multi-column layouts, embedded graphics, and font weights.',
    category: 'convert',
    qualityBadge: 'LAYOUT DOCX',
    acceptType: 'pdf',
    multiple: false,
    defaultConfig: { pages: '' },
  },
  {
    id: 'watermark',
    code: '11',
    title: 'Watermark & Numbers',
    shortTitle: 'Watermark / #',
    desc: 'Stamp razor-sharp vector watermarks (diagonal, header, footer) and automatic Page X of Y numbering overlays.',
    category: 'security',
    qualityBadge: 'VECTOR OVERLAY',
    acceptType: 'pdf',
    multiple: false,
    defaultConfig: {
      text: 'CONFIDENTIAL',
      position: 'diagonal',
      color: 'gray',
      opacity: 0.18,
      font_size: 52,
      page_numbers: true,
      number_position: 'bottom-right',
      number_format: 'page_of',
      start_number: 1,
    },
  },
  {
    id: 'protect',
    code: '12',
    title: 'Protect / Unlock PDF',
    shortTitle: 'Protect / Unlock',
    desc: 'Encrypt sensitive PDFs with military-grade 256-bit AES passwords & print/copy permissions, or unlock authorized files.',
    category: 'security',
    qualityBadge: 'AES-256 CRYPTO',
    acceptType: 'pdf',
    multiple: false,
    defaultConfig: {
      mode: 'encrypt',
      password: '',
      allow_print: true,
      allow_copy: false,
    },
  },
]

export function getToolById(id: string | null | undefined): ToolDefinition {
  return STUDIO_TOOLS.find((t) => t.id === id) || STUDIO_TOOLS[0]
}

export function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
