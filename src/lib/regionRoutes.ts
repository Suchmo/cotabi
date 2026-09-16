import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { spotFromDoc, tripFromDoc } from './firestoreMappers'
import { colorForTripIndex } from './tripColorPalette'
import type { Spot } from '../types/models'

export type LocatedSpot = Spot & { latitude: number; longitude: number }

export type TripRoute = {
  tripId: string
  title: string
  color: string
  spots: LocatedSpot[]
}

export type RegionKey = {
  countryCode: string
  // nullの場合は国単位で一致とみなす(世界地図から国をタップした場合)。
  // 都道府県コードが指定されている場合はそれも一致させる(日本地図から
  // 都道府県をタップした場合)。
  prefectureCode: string | null
}

function isLocated(spot: Spot): spot is LocatedSpot {
  return spot.latitude !== null && spot.longitude !== null
}

function matchesRegion(
  region: RegionKey,
  countryCode: string,
  prefectureCode: string | null,
): boolean {
  if (countryCode !== region.countryCode) return false
  if (region.prefectureCode === null) return true
  return prefectureCode === region.prefectureCode
}

export async function getRegionRoutes(region: RegionKey): Promise<{
  routes: TripRoute[]
  pins: LocatedSpot[]
}> {
  const [tripsSnap, spotsSnap] = await Promise.all([
    getDocs(collection(db, 'trips')),
    getDocs(collection(db, 'spots')),
  ])

  // CLAUDE.mdの「ルートマップの色分け」ルール: 固定パレットを旅行の登録順
  // (作成日時の昇順、地域を問わず全体での順序)に自動割り当てる。
  const allTrips = tripsSnap.docs
    .map(tripFromDoc)
    .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0))

  const colorByTripId = new Map(
    allTrips.map((trip, index) => [trip.id, colorForTripIndex(index)]),
  )

  const allSpots = spotsSnap.docs.map(spotFromDoc)

  // 1つの旅行に複数の国・都道府県のスポットが混在する場合があるため(例:
  // 「ヨーロッパ旅行」にイタリア・スイス・フランスのスポットが混在)、
  // 旅行(TRIP)単位ではなくスポット(SPOT)単位でこの地域に一致するかを判定する。
  // 該当地域のスポットだけを日付順でつないだものを、その旅行のルートとする。
  const matchingSpotsByTripId = new Map<string, LocatedSpot[]>()
  const pins: LocatedSpot[] = []

  for (const spot of allSpots) {
    if (!isLocated(spot)) continue
    if (!matchesRegion(region, spot.countryCode, spot.prefectureCode)) continue

    if (spot.tripId) {
      const list = matchingSpotsByTripId.get(spot.tripId)
      if (list) list.push(spot)
      else matchingSpotsByTripId.set(spot.tripId, [spot])
    } else {
      pins.push(spot)
    }
  }

  const routes: TripRoute[] = allTrips
    .filter((trip) => matchingSpotsByTripId.has(trip.id))
    .map((trip) => ({
      tripId: trip.id,
      title: trip.title,
      color: colorByTripId.get(trip.id)!,
      spots: matchingSpotsByTripId
        .get(trip.id)!
        .slice()
        .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt)),
    }))

  return { routes, pins }
}
