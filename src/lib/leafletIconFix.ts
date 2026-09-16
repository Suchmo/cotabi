import L from 'leaflet'

// LeafletのデフォルトマーカーアイコンはCSSではなく相対URLで画像を参照しており、
// Viteのバンドル環境ではそのままだと画像が壊れる。ここではCOTABI用に用意した
// ゴールド基調のカスタムピン画像(public/marker-icon.png, marker-icon-2x.png)を
// 使うよう差し替える。design_system.mdの「影を使わない」方針に沿って、
// シャドウ画像(marker-shadow.png)は使用しない。
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: undefined,
  shadowSize: undefined,
  shadowAnchor: undefined,
})
