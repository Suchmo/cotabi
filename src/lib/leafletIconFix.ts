import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// LeafletのデフォルトマーカーアイコンはCSSではなく相対URLで画像を参照しており、
// Viteのバンドル環境ではそのままだと画像が壊れる。ビルド済みアセットのURLを
// 明示的に指定して修正する(既知のLeaflet+バンドラー問題への定番対応)。
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})
