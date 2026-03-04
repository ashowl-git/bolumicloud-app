export function decimalToDMS(decimal: number): { degrees: number; minutes: number; seconds: number } {
  const d = Math.floor(Math.abs(decimal))
  const m = Math.floor((Math.abs(decimal) - d) * 60)
  const s = ((Math.abs(decimal) - d) * 60 - m) * 60
  return { degrees: decimal >= 0 ? d : -d, minutes: m, seconds: Math.round(s * 100) / 100 }
}

export function dmsToDecimal(d: number, m: number, s: number): number {
  const sign = d >= 0 ? 1 : -1
  return sign * (Math.abs(d) + m / 60 + s / 3600)
}
