import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useFlashback } from '../hooks/useFlashback'
import { formatLocationLabel } from '../lib/locationLabel'
import './FlashbackCards.css'

// 「〇年前の今日」カード。該当する記録が無い日は何も描画しない
// (読み込み中も含め、無駄な空欄を作らない)。
export function FlashbackCards() {
  const { items } = useFlashback()

  if (items.length === 0) return null

  return (
    <div className="flashback-cards">
      {items.map(({ spot, yearsAgo, tripTitle, thumbnailUrl }) => (
        <Link key={spot.id} to={`/spots/${spot.id}`} className="flashback-cards__card">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              className="flashback-cards__thumb"
            />
          ) : (
            <div className="flashback-cards__thumb flashback-cards__thumb--placeholder" />
          )}
          <div className="flashback-cards__body">
            <p className="flashback-cards__badge">
              <Sparkles size={12} strokeWidth={1.5} />
              {yearsAgo}年前の今日
            </p>
            <h3 className="flashback-cards__title">{spot.name}</h3>
            <p className="flashback-cards__meta">
              {formatLocationLabel(spot.countryCode, spot.prefectureCode)}
              {tripTitle ? ` ・ ${tripTitle}` : ''}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
