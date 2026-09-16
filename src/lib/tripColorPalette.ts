// 旅行ごとのルート表示色。CLAUDE.mdの「ルートマップの色分け」ルールに従い、
// 固定パレットを旅行の登録順(作成日時の昇順)に自動割り当てる。ユーザーによる色選択は行わない。
const PALETTE = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#d97706', // amber
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#db2777', // pink
  '#65a30d', // lime
  '#ea580c', // orange
  '#4338ca', // indigo
]

export function colorForTripIndex(index: number): string {
  return PALETTE[index % PALETTE.length]
}
