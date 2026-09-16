// 地図コンポーネント自体はdesign_system.mdの配色対象外とし、実際の地形が
// 判読しやすい明るい配色(海=青系・陸=緑系、英語表記)のCartoDB Voyagerタイルを
// 使う。アプリの他の部分(タブ・カード・ボタン等)はダーク基調のまま。
export const LIGHT_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png'

export const LIGHT_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
