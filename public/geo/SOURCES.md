# 地図データの出典・ライセンス

## world-countries.geojson(世界の国境データ)

- 出典: [Natural Earth](https://www.naturalearthdata.com/) — `ne_50m_admin_0_countries`(1:50,000,000、中解像度)
- 取得元: https://github.com/nvkelso/natural-earth-vector (Natural Earth公式データのGitHubミラー)
- ライセンス: **パブリックドメイン**。商用利用・改変・再配布すべて許可、帰属表示も不要(Natural Earth公式サイトの利用規約より)
- 解像度の選定理由: 最小解像度版(110m)ではシンガポール・モナコ・バチカン・マルタなど小国が図形として含まれていないため、旅行記録アプリとして実用的な50m版を採用(生ファイル約3MB、gzip配信で数百KB程度に圧縮される想定)
- 国コードとして参照する場合は `properties.ISO_A2_EH` を使用すること(`properties.ISO_A2` / `ISO_A3` はフランス・ノルウェー等一部の国で `"-99"` となる既知の不具合があるため使用しない)。`ISO_A2_EH` でも一部の非承認地域(ソマリランド、北キプロス等)は値が取れないが、旅行記録アプリの実用上問題になる想定はない

## japan-prefectures.geojson(日本の都道府県境界データ)

- 出典: 国土交通省 国土数値情報(行政区域データ)を加工した [smartnews-smri/japan-topography](https://github.com/smartnews-smri/japan-topography)(スマートニュース株式会社)
- 取得元ファイル: `data/municipality/geojson/s0001/prefectures.json`(境界線0.1%簡素化版、47都道府県)
- ライセンス: 加工者(スマートニュース)のクレジット表示は不要。商用・非商用問わず無償利用可。**ただし出典データが国土交通省 国土数値情報であるため、実際にアプリ内で地図を表示する際は「国土交通省 国土数値情報(行政区域データ)」等の出典クレジットを画面のどこかに表示すること**
- 都道府県コード(JIS X 0401、01〜47)は含まれておらず、`properties.N03_001` に都道府県名(例:「北海道」「東京都」)が入っているのみ。データモデルの`prefecture_code`と紐づけるには、実装時に都道府県名→コードの対応表を別途用意する必要がある
