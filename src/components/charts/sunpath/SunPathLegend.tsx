interface SunPathLegendProps {
  sunPaths: Array<{ color: string; label: string }>
  hasObstructions: boolean
}

export default function SunPathLegend({ sunPaths, hasObstructions }: SunPathLegendProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {sunPaths.map((sp, idx) => (
        <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span
            className="w-3 h-0.5 inline-block"
            style={{ backgroundColor: sp.color }}
          />
          <span>{sp.label}</span>
        </div>
      ))}
      {hasObstructions && (
        <>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 inline-block bg-slate-500 opacity-30" />
            <span>Obstructions</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-3 h-0.5 inline-block border-t border-dashed border-slate-400"
            />
            <span>Blocked</span>
          </div>
        </>
      )}
    </div>
  )
}
