'use client'
import Link from 'next/link'

export default function ToolCard({ tool }: { tool: any }) {
  return (
    <Link href={`/studio?tool=${tool.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 h-full hover:shadow-md transition-shadow cursor-pointer flex flex-col items-start group">
        <div className="mb-4 bg-gray-50 rounded-xl p-3 inline-flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
          {tool.icon}
        </div>
        <h3 className="text-[14px] font-semibold text-gray-900 mb-2">{tool.title}</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">{tool.desc}</p>
      </div>
    </Link>
  )
}
