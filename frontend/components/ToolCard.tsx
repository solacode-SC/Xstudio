'use client'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ToolDefinition } from '@/lib/tools'
import { getToolIcon } from '@/components/ToolIcon'

export default function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link href={`/studio?tool=${tool.id}`} className="block h-full">
      <article className="studio-card rounded-2xl p-5 h-full flex flex-col justify-between group cursor-pointer">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-[#0A0A0B] group-hover:bg-[#0A0A0B] group-hover:text-white group-hover:border-[#0A0A0B] transition-colors">
              {getToolIcon(tool.id, 'w-5 h-5')}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                {tool.qualityBadge}
              </span>
              <span className="font-mono text-[11px] font-semibold text-zinc-400">
                {tool.code}
              </span>
            </div>
          </div>

          <h3 className="font-display text-[17px] font-bold text-[#0A0A0B] tracking-tight mb-1.5 group-hover:text-[#FF4D00] transition-colors">
            {tool.title}
          </h3>
          <p className="text-[12.5px] text-zinc-500 leading-relaxed">
            {tool.desc}
          </p>
        </div>

        <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-[12px] font-semibold text-zinc-700 group-hover:text-[#0A0A0B]">
          <span>Launch Workbench</span>
          <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#FF4D00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </article>
    </Link>
  )
}
