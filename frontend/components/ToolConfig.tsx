'use client'
import { useState, useEffect } from 'react'

export default function ToolConfig({ toolId, onChange }: { toolId: string, onChange: (conf: any) => void }) {
  const [config, setConfig] = useState<any>({})

  useEffect(() => {
    onChange(config)
  }, [config, onChange])

  if (toolId === 'split') {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">Split by page range</label>
        <input 
          type="text" 
          placeholder="e.g., 1-3, 5, 7-10" 
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-[14px] placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
          onChange={e => setConfig({ ranges: e.target.value })}
        />
      </div>
    )
  }

  if (toolId === 'compress') {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">Compression Quality</label>
        <select 
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-[14px] bg-white focus:border-black focus:outline-none transition-colors appearance-none"
          onChange={e => setConfig({ quality: e.target.value })}
          defaultValue="medium"
        >
          <option value="low">Low (Maximum Compression)</option>
          <option value="medium">Medium (Recommended)</option>
          <option value="high">High (Better Quality)</option>
        </select>
      </div>
    )
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-[13px] text-gray-500">Ready to process. Click the button above to begin.</p>
    </div>
  )
}
