interface ObstructionItem {
  name: string
  color: string
}

interface SunPathItem {
  date: string
  label: string
  color: string
}

interface WaldramLegendProps {
  obstructions: ObstructionItem[]
  sunPaths: SunPathItem[]
  editable: boolean
  selectedIdx: number | null
  onSelect: (idx: number | null) => void
}

export default function WaldramLegend({
  obstructions,
  sunPaths,
  editable,
  selectedIdx,
  onSelect,
}: WaldramLegendProps) {
  if (obstructions.length === 0 && sunPaths.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {obstructions.map((obs, idx) => (
        <button
          key={obs.name + idx}
          type="button"
          onClick={() => !editable && onSelect(selectedIdx === idx ? null : idx)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs border transition-all duration-200 ${
            selectedIdx === idx
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span
            className="w-3 h-3 inline-block"
            style={{ backgroundColor: obs.color, opacity: 0.6 }}
          />
          <span className="text-gray-700">{obs.name}</span>
        </button>
      ))}
      {sunPaths.map((sp, idx) => (
        <div
          key={`sp-legend-${sp.date}-${idx}`}
          className="flex items-center gap-1.5 px-2 py-1 text-xs border border-gray-200"
        >
          <span
            className="w-6 h-0.5 inline-block"
            style={{ backgroundColor: sp.color }}
          />
          <span className="text-gray-700">{sp.label}</span>
        </div>
      ))}
    </div>
  )
}
