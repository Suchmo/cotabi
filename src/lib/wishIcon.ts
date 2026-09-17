import L from 'leaflet'

// 訪問済みスポットのゴールド塗りつぶしピン(leafletIconFix.tsのデフォルト
// アイコン)とはっきり区別するため、ウィッシュリストは塗りつぶさない
// 点線アウトラインの丸印にする。画像アセットを使わず、DOM要素として
// 描画するdivIconなのでCSSカスタムプロパティ(var(--color-accent))が
// そのまま使える。
export const wishIcon = L.divIcon({
  className: 'wish-marker',
  html: '<span class="wish-marker__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
