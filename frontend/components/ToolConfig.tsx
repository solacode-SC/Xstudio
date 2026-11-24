'use client'
import { useState } from 'react'
import { Eye, EyeOff, RotateCcw, RotateCw, Info } from 'lucide-react'

function Segmented({
  options,
  value,
  onSelect,
}: {
  options: { id: string | number; label: string }[]
  value: string | number
  onSelect: (id: any) => void
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200">
      {options.map((opt) => {
        const active = String(value) === String(opt.id)
        return (
          <button
            key={String(opt.id)}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all text-center truncate ${
              active
                ? 'bg-[#0A0A0B] text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-zinc-200 bg-white cursor-pointer hover:border-zinc-300 transition-colors">
      <div>
        <div className="text-[12.5px] font-semibold text-zinc-900">{label}</div>
        {desc && <div className="text-[11px] text-zinc-500 mt-0.5">{desc}</div>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#0A0A0B] rounded cursor-pointer shrink-0"
      />
    </label>
  )
}

export default function ToolConfig({
  toolId,
  value,
  onChange,
}: {
  toolId: string
  value: Record<string, any>
  onChange: (conf: Record<string, any>) => void
}) {
  const [showPass, setShowPass] = useState(false)

  if (toolId === 'split') {
    const mode = value.mode || 'ranges'
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
            Split Strategy
          </label>
          <Segmented
            value={mode}
            onSelect={(m) => onChange({ ...value, mode: m })}
            options={[
              { id: 'ranges', label: 'Custom Ranges' },
              { id: 'every_n', label: 'Every N Pages' },
              { id: 'burst', label: 'Every Page' },
            ]}
          />
        </div>

        {mode === 'ranges' && (
          <>
            <div>
              <label className="block text-[12.5px] font-semibold text-zinc-800 mb-1.5">
                Page Ranges or Selected Pages
              </label>
              <input
                type="text"
                value={value.ranges || ''}
                placeholder="e.g., 1-3, 4-6, 7-end (click pages on right)"
                className="w-full font-mono border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white placeholder-zinc-400 focus:border-[#0A0A0B] focus:outline-none"
                onChange={(e) => onChange({ ...value, ranges: e.target.value })}
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Each comma-separated range becomes a crisp vector PDF inside a ZIP archive (unless merged below).
              </p>
            </div>
            <ToggleRow
              label="Combine ranges into one PDF"
              desc="Outputs a single merged PDF instead of separate files in a ZIP"
              checked={!!value.merge_ranges}
              onChange={(v) => onChange({ ...value, merge_ranges: v })}
            />
          </>
        )}

        {mode === 'every_n' && (
          <div>
            <label className="block text-[12.5px] font-semibold text-zinc-800 mb-1.5">
              Pages per split file
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={value.every_n || 2}
              onChange={(e) =>
                onChange({
                  ...value,
                  every_n: Math.max(1, parseInt(e.target.value || '1', 10)),
                })
              }
              className="w-full font-mono border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white focus:border-[#0A0A0B] focus:outline-none"
            />
          </div>
        )}

        {mode === 'burst' && (
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[12px] text-zinc-600">
            Every page in your PDF will be exported as its own standalone, 100% lossless PDF inside a clean ZIP package.
          </div>
        )}
      </div>
    )
  }

  if (toolId === 'merge') {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-3">
        <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
          Merge Precision Options
        </label>
        <ToggleRow
          label="Generate PDF Bookmarks (Outline)"
          desc="Creates a clickable sidebar Table of Contents from each filename"
          checked={value.add_bookmarks !== false}
          onChange={(v) => onChange({ ...value, add_bookmarks: v })}
        />
        <ToggleRow
          label="Normalize mixed dimensions to A4"
          desc="Keep off for native page sizes; enable to unify varied scan dimensions"
          checked={!!value.normalize_a4}
          onChange={(v) => onChange({ ...value, normalize_a4: v })}
        />
      </div>
    )
  }

  if (toolId === 'compress') {
    const q = value.quality || 'medium'
    const presets = [
      {
        id: 'lossless',
        title: 'Lossless Structure',
        badge: '100% LOSSLESS',
        desc: 'Purges redundant streams & subsets fonts without altering pixels.',
      },
      {
        id: 'high',
        title: 'Print Studio (300 DPI)',
        badge: '300 DPI',
        desc: 'Press-grade clarity with bicubic downsampling above 300 DPI.',
      },
      {
        id: 'medium',
        title: 'Balanced Studio (180 DPI)',
        badge: 'RECOMMENDED',
        desc: 'Ideal sharpness-to-weight balance for everyday sharing.',
      },
      {
        id: 'low',
        title: 'Compact Web (110 DPI)',
        badge: 'MAX SAVINGS',
        desc: 'Smallest file footprint for strict upload portals & email.',
      },
    ]
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-2.5">
        <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
          Target Preset (All 4 generated for live comparison)
        </label>
        {presets.map((p) => {
          const active = q === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ ...value, quality: p.id })}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                active
                  ? 'border-[#0A0A0B] bg-zinc-950 text-white shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-400 text-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12.5px] font-bold">{p.title}</span>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                    active
                      ? 'bg-[#FF4D00] text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {p.badge}
                </span>
              </div>
              <p
                className={`text-[11.5px] ${
                  active ? 'text-zinc-300' : 'text-zinc-500'
                }`}
              >
                {p.desc}
              </p>
            </button>
          )
        })}
      </div>
    )
  }

  if (toolId === 'extract') {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-zinc-800 mb-1.5">
            Pages to Extract
          </label>
          <input
            type="text"
            value={value.pages || ''}
            placeholder="e.g., 1-3, 5, 9-end (or click pages in canvas)"
            className="w-full font-mono border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white placeholder-zinc-400 focus:border-[#0A0A0B] focus:outline-none"
            onChange={(e) => onChange({ ...value, pages: e.target.value })}
          />
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Click thumbnails in the right canvas or type ranges in any order.
          </p>
        </div>
        <ToggleRow
          label="Export each selected page as a separate PDF (.zip)"
          desc="Leave unchecked to combine extracted pages into a single PDF"
          checked={!!value.separate_files}
          onChange={(v) => onChange({ ...value, separate_files: v })}
        />
      </div>
    )
  }

  if (toolId === 'delete') {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-3">
        <label className="block text-[12.5px] font-semibold text-zinc-800">
          Pages Marked for Deletion
        </label>
        <input
          type="text"
          value={value.pages || ''}
          placeholder="Click pages in canvas or type e.g. 2, 4-6"
          className="w-full font-mono border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white placeholder-zinc-400 focus:border-red-600 focus:outline-none"
          onChange={(e) => onChange({ ...value, pages: e.target.value })}
        />
        <p className="text-[11.5px] text-zinc-500">
          Selected pages are highlighted in crimson on the right canvas and purged along with unused image/font objects.
        </p>
      </div>
    )
  }

  if (toolId === 'rotate') {
    const customCount = Object.values(value.rotations || {}).filter(
      (deg: any) => Number(deg) % 360 !== 0
    ).length
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
            Batch Rotation Target
          </label>
          <Segmented
            value={value.target || 'all'}
            onSelect={(t) => onChange({ ...value, target: t })}
            options={[
              { id: 'all', label: 'All' },
              { id: 'odd', label: 'Odd' },
              { id: 'even', label: 'Even' },
              { id: 'landscape', label: 'Landscape' },
            ]}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-zinc-800 mb-2">
            Batch Angle ({value.global_angle || 0}°)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { deg: -90, label: '-90° Left', icon: <RotateCcw className="w-3.5 h-3.5" /> },
              { deg: 90, label: '+90° Right', icon: <RotateCw className="w-3.5 h-3.5" /> },
              { deg: 180, label: '180° Flip', icon: null },
              { deg: 0, label: '0° None', icon: null },
            ].map((b) => (
              <button
                key={b.deg}
                type="button"
                onClick={() => onChange({ ...value, global_angle: b.deg })}
                className={`py-2 px-2 rounded-xl border text-[11.5px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  (value.global_angle || 0) === b.deg
                    ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {b.icon}
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-[12px]">
          <span className="text-zinc-600">
            Individual page overrides: <strong>{customCount}</strong>
          </span>
          {customCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...value, rotations: {} })}
              className="font-semibold text-[#FF4D00] hover:underline"
            >
              Reset overrides
            </button>
          )}
        </div>
      </div>
    )
  }

  if (toolId === 'organize') {
    const count = Array.isArray(value.page_order) ? value.page_order.length : null
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-3">
        <div className="p-4 rounded-2xl bg-zinc-950 text-white space-y-1.5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#FF4D00] font-semibold">
            Interactive Lightboard Active
          </div>
          <p className="text-[12.5px] text-zinc-200 leading-relaxed">
            Drag page cards in the right canvas to reorder them, rotate individual pages, duplicate slides, or remove unwanted pages in one lossless pass.
          </p>
          {count !== null && (
            <p className="font-mono text-[11px] text-zinc-400 pt-1">
              Output sequence: {count} page{count === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (toolId === 'pdf_to_images') {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
            Output Image Format
          </label>
          <Segmented
            value={value.format || 'png'}
            onSelect={(f) => onChange({ ...value, format: f })}
            options={[
              { id: 'png', label: 'PNG (Lossless)' },
              { id: 'jpg', label: 'JPG (95% 4:4:4)' },
              { id: 'webp', label: 'WebP (Crisp)' },
            ]}
          />
        </div>

        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
            Render Resolution (DPI)
          </label>
          <Segmented
            value={value.dpi || 300}
            onSelect={(d) => onChange({ ...value, dpi: Number(d) })}
            options={[
              { id: 150, label: '150 DPI Web' },
              { id: 300, label: '300 DPI Print' },
              { id: 600, label: '600 DPI Ultra' },
            ]}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-zinc-800 mb-1.5">
            Page Filter (Optional)
          </label>
          <input
            type="text"
            value={value.pages || ''}
            placeholder="Leave blank for all pages, or e.g. 1, 3-5"
            className="w-full font-mono border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white placeholder-zinc-400 focus:border-[#0A0A0B] focus:outline-none"
            onChange={(e) => onChange({ ...value, pages: e.target.value })}
          />
        </div>
      </div>
    )
  }

  if (toolId === 'images_to_pdf') {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
            Page Geometry
          </label>
          <Segmented
            value={value.page_size || 'a4'}
            onSelect={(s) => onChange({ ...value, page_size: s })}
            options={[
              { id: 'a4', label: 'A4 Standard' },
              { id: 'letter', label: 'US Letter' },
              { id: 'fit', label: 'Fit Image (Zero Border)' },
            ]}
          />
        </div>

        {(value.page_size || 'a4') !== 'fit' && (
          <>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
                Orientation
              </label>
              <Segmented
                value={value.orientation || 'auto'}
                onSelect={(o) => onChange({ ...value, orientation: o })}
                options={[
                  { id: 'auto', label: 'Auto Match' },
                  { id: 'portrait', label: 'Portrait' },
                  { id: 'landscape', label: 'Landscape' },
                ]}
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
                Canvas Margin
              </label>
              <Segmented
                value={value.margin || 'small'}
                onSelect={(m) => onChange({ ...value, margin: m })}
                options={[
                  { id: 'none', label: 'Full Bleed' },
                  { id: 'small', label: '10mm Clean' },
                  { id: 'large', label: '20mm Gallery' },
                ]}
              />
            </div>
          </>
        )}
      </div>
    )
  }

  if (toolId === 'pdf_to_word') {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex gap-2.5">
          <Info className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-600 leading-relaxed">
            <strong>High-Fidelity Layout Reconstruction:</strong> Tables, multi-column blocks, embedded images, and font styles are mapped into native editable Word structures.
          </p>
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-zinc-800 mb-1.5">
            Page Range (Optional)
          </label>
          <input
            type="text"
            value={value.pages || ''}
            placeholder="All pages (or e.g. 1-5)"
            className="w-full font-mono border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white placeholder-zinc-400 focus:border-[#0A0A0B] focus:outline-none"
            onChange={(e) => onChange({ ...value, pages: e.target.value })}
          />
        </div>
      </div>
    )
  }

  if (toolId === 'watermark') {
    const stamps = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'APPROVED']
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-zinc-800 mb-1.5">
            Vector Watermark Text
          </label>
          <input
            type="text"
            value={value.text ?? 'CONFIDENTIAL'}
            placeholder="Leave empty for page numbers only"
            className="w-full border border-zinc-200 rounded-xl px-3.5 py-2 text-[13px] bg-white focus:border-[#0A0A0B] focus:outline-none"
            onChange={(e) => onChange({ ...value, text: e.target.value })}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {stamps.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...value, text: s })}
                className="font-mono text-[10px] px-2 py-1 rounded-md border border-zinc-200 bg-zinc-50 hover:border-zinc-900 text-zinc-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {value.text && (
          <>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
                Placement
              </label>
              <Segmented
                value={value.position || 'diagonal'}
                onSelect={(p) => onChange({ ...value, position: p })}
                options={[
                  { id: 'diagonal', label: 'Diagonal' },
                  { id: 'center', label: 'Center' },
                  { id: 'header', label: 'Header' },
                  { id: 'footer', label: 'Footer' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                  Ink Color
                </label>
                <Segmented
                  value={value.color || 'gray'}
                  onSelect={(c) => onChange({ ...value, color: c })}
                  options={[
                    { id: 'gray', label: 'Slate' },
                    { id: 'red', label: 'Red' },
                    { id: 'blue', label: 'Blue' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                  Opacity ({Math.round((value.opacity ?? 0.18) * 100)}%)
                </label>
                <input
                  type="range"
                  min={0.08}
                  max={0.65}
                  step={0.02}
                  value={value.opacity ?? 0.18}
                  onChange={(e) =>
                    onChange({ ...value, opacity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#0A0A0B] mt-2"
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-2 border-t border-zinc-100 space-y-3">
          <ToggleRow
            label="Add Automatic Page Numbers"
            desc="Stamps crisp vector page counters (e.g. Page 1 of 12)"
            checked={!!value.page_numbers}
            onChange={(v) => onChange({ ...value, page_numbers: v })}
          />
          {value.page_numbers && (
            <Segmented
              value={value.number_position || 'bottom-right'}
              onSelect={(pos) => onChange({ ...value, number_position: pos })}
              options={[
                { id: 'bottom-right', label: 'Bottom Right' },
                { id: 'bottom-center', label: 'Bottom Center' },
                { id: 'top-right', label: 'Top Right' },
              ]}
            />
          )}
        </div>
      </div>
    )
  }

  if (toolId === 'protect') {
    const mode = value.mode || 'encrypt'
    return (
      <div className="mt-6 border-t border-zinc-200 pt-5 space-y-4">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
            Security Operation
          </label>
          <Segmented
            value={mode}
            onSelect={(m) => onChange({ ...value, mode: m })}
            options={[
              { id: 'encrypt', label: 'Encrypt (AES-256)' },
              { id: 'unlock', label: 'Unlock PDF' },
            ]}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-zinc-800 mb-1.5">
            {mode === 'encrypt' ? 'Set Document Password' : 'Enter Current PDF Password'}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={value.password || ''}
              placeholder={
                mode === 'encrypt'
                  ? 'Strong password required to open PDF'
                  : 'Password to decrypt & remove lock'
              }
              className="w-full font-mono border border-zinc-200 rounded-xl pl-3.5 pr-10 py-2.5 text-[13px] bg-white focus:border-[#0A0A0B] focus:outline-none"
              onChange={(e) => onChange({ ...value, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mode === 'encrypt' && (
          <div className="space-y-2.5">
            <ToggleRow
              label="Allow High-Resolution Printing"
              checked={value.allow_print !== false}
              onChange={(v) => onChange({ ...value, allow_print: v })}
            />
            <ToggleRow
              label="Allow Text & Graphic Copying"
              checked={!!value.allow_copy}
              onChange={(v) => onChange({ ...value, allow_copy: v })}
            />
          </div>
        )}
      </div>
    )
  }

  return null
}
