import { useEffect, useState } from 'react'
import { useVisitedLocations } from '../hooks/useVisitedLocations'
import { listTrips } from '../lib/records'
import './StatsScreen.css'

export function StatsScreen() {
  const { countryCodes, prefectureCodes, loading } = useVisitedLocations()
  const [totalCostYen, setTotalCostYen] = useState<number | null>(null)

  useEffect(() => {
    listTrips().then((trips) => {
      const total = trips.reduce((sum, trip) => sum + (trip.costYen ?? 0), 0)
      setTotalCostYen(total)
    })
  }, [])

  return (
    <div className="stats-screen">
      <h1>統計</h1>
      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <div className="stats-screen__cards">
          <div className="stats-screen__card">
            <div className="stats-screen__card-value">
              {countryCodes.size}
            </div>
            <div className="stats-screen__card-label">訪問した国</div>
          </div>
          <div className="stats-screen__card">
            <div className="stats-screen__card-value">
              {prefectureCodes.size}
            </div>
            <div className="stats-screen__card-label">訪問した都道府県</div>
          </div>
          <div className="stats-screen__card">
            <div className="stats-screen__card-value">
              {totalCostYen === null ? '…' : `${totalCostYen.toLocaleString()}円`}
            </div>
            <div className="stats-screen__card-label">旅行費用の合計</div>
          </div>
        </div>
      )}
    </div>
  )
}
