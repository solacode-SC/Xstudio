'use client'
import Link from 'next/link'
import { LayoutDashboard, X, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { STUDIO_TOOLS, ToolCategory } from '@/lib/tools'
import { getToolIcon } from '@/components/ToolIcon'
import { checkEngineHealth } from '@/lib/api'

const SECTIONS: { key: ToolCategory; label: string }[] = [
  { key: 'organize', label: 'Organize & Edit' },
  { key: 'optimize', label: 'Optimize' },
  { key: 'convert', label: 'Convert Studio' },
  { key: 'security', label: 'Stamp & Security' },
]

export default function Sidebar({
  activeTool,
  isOpen,
  onClose,
}: {
  activeTool: string
  isOpen?: boolean
  onClose?: () => void
}) {
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    checkEngineHealth().then(setOnline)
  }, [])

  const closeMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose()
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-[248px] bg-white border-r border-zinc-200 flex flex-col h-screen shrink-0 fixed md:sticky md:top-0 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-[60px] px-5 border-b border-zinc-200 flex items-center justify-between shrink-0">
          <Link href="/" onClick={closeMobile} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#0A0A0B] text-white rounded-lg flex items-center justify-center relative shadow-sm group-hover:bg-[#FF4D00] transition-colors">
              <span className="font-display font-bold text-[15px] tracking-tighter">X</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] group-hover:bg-white absolute top-1.5 right-1.5 transition-colors" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-[#0A0A0B] tracking-tight text-[16px]">
                Xstudio
              </span>
              <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                2.0
              </span>
            </div>
          </Link>
          <button
            className="md:hidden text-zinc-400 hover:text-zinc-900 p-1"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <Link href="/" onClick={closeMobile}>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                  activeTool === 'home'
                    ? 'bg-[#0A0A0B] text-white shadow-sm'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Studio Hub</span>
                </div>
                <span
                  className={`font-mono text-[10px] ${
                    activeTool === 'home' ? 'text-zinc-400' : 'text-zinc-400'
                  }`}
                >
                  12
                </span>
              </div>
            </Link>
          </div>

          {SECTIONS.map((sec) => {
            const items = STUDIO_TOOLS.filter((t) => t.category === sec.key)
            return (
              <div key={sec.key}>
                <div className="px-3 mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold text-zinc-400">
                  {sec.label}
                </div>
                <div className="space-y-0.5">
                  {items.map((tool) => {
                    const isActive = activeTool === tool.id
                    return (
                      <Link
                        key={tool.id}
                        href={`/studio?tool=${tool.id}`}
                        onClick={closeMobile}
                      >
                        <div
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[12.5px] transition-all ${
                            isActive
                              ? 'bg-zinc-900 text-white font-semibold shadow-sm'
                              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={
                                isActive ? 'text-[#FF4D00]' : 'text-zinc-400'
                              }
                            >
                              {getToolIcon(tool.id, 'w-4 h-4')}
                            </span>
                            <span className="truncate">{tool.shortTitle}</span>
                          </div>
                          <span
                            className={`font-mono text-[10px] ${
                              isActive ? 'text-zinc-400' : 'text-zinc-300'
                            }`}
                          >
                            {tool.code}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Privacy & Engine Status */}
        <div className="p-3 border-t border-zinc-200 bg-zinc-50/70 shrink-0">
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    online === false
                      ? 'bg-amber-500'
                      : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-800">
                  {online === false ? 'Standby' : 'Engine Ready'}
                </span>
              </div>
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug">
              Zero-retention workspace. Temporary files auto-purge every 10 min.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
