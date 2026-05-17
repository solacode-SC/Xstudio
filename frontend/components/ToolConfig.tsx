'use client'

export default function ToolConfig({ toolId, value, onChange }: { toolId: string, value: any, onChange: (conf: any) => void }) {

  if (toolId === 'split' || toolId === 'extract') {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">
          {toolId === 'split' ? 'Split by page range' : 'Extract specific pages'}
        </label>
        <input 
          type="text" 
          value={value.ranges || value.pages || ''}
          placeholder="e.g., 1-3, 5, 7-10" 
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-[14px] placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
          onChange={e => onChange({ ...value, [toolId === 'split' ? 'ranges' : 'pages']: e.target.value })}
        />
      </div>
    )
  }

  if (toolId === 'delete') {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">Pages to delete</label>
        <input 
          type="text" 
          value={value.pages || ''}
          placeholder="e.g., 1, 4-6" 
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-[14px] placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
          onChange={e => onChange({ ...value, pages: e.target.value })}
        />
        <p className="text-[11px] text-gray-500 mt-2">You can type pages here or click on them in the preview panel.</p>
      </div>
    )
  }

  if (toolId === 'compress') {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">Compression Quality</label>
        <select 
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-[14px] bg-white focus:border-black focus:outline-none transition-colors appearance-none"
          onChange={e => onChange({ ...value, quality: e.target.value })}
          value={value.quality || 'medium'}
        >
          <option value="low">Low (Maximum Compression)</option>
          <option value="medium">Medium (Recommended)</option>
          <option value="high">High (Better Quality)</option>
        </select>
      </div>
    )
  }

  if (toolId === 'rotate') {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-[13px] font-medium text-gray-700">Hover over any page in the preview panel on the right to rotate it individually.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-[13px] text-gray-500">Ready to process. Click the button above to begin.</p>
    </div>
  )
}
