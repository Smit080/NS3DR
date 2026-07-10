// rows: array of { quantity_required, component: { quantity } }
// Returns the number of complete machines buildable from current stock,
// limited by whichever required component runs out first.
export function computeBuildable(rows) {
  if (!rows || rows.length === 0) return 0
  let min = Infinity
  for (const row of rows) {
    const need = Number(row.quantity_required) || 0
    const have = Number(row.component?.quantity ?? 0)
    if (need <= 0) continue
    const possible = Math.floor(have / need)
    if (possible < min) min = possible
  }
  return min === Infinity ? 0 : min
}
