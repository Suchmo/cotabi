import { collection } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { getDocsCached } from '../lib/queryCache'

export type VisitedLocations = {
  countryCodes: Set<string>
  prefectureCodes: Set<string>
  loading: boolean
}

const spotsCollection = collection(db, 'spots')

// docs/screen_design_v5.md の訪問済み判定ルールに従い、tripIdの有無を問わず
// spots に記録されている countryCode/prefectureCode をそのまま「訪問済み」とみなす
// (trips コレクションを経由しない。単発記録にもtripIdなしでcountryCode/prefectureCodeが
// 必ず入っている設計のため)。
export function useVisitedLocations(): VisitedLocations {
  const [countryCodes, setCountryCodes] = useState<Set<string>>(new Set())
  const [prefectureCodes, setPrefectureCodes] = useState<Set<string>>(
    new Set(),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getDocsCached('spots', spotsCollection).then((snapshot) => {
      if (cancelled) return

      const countries = new Set<string>()
      const prefectures = new Set<string>()
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.countryCode) countries.add(data.countryCode as string)
        if (data.prefectureCode) prefectures.add(data.prefectureCode as string)
      })

      setCountryCodes(countries)
      setPrefectureCodes(prefectures)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { countryCodes, prefectureCodes, loading }
}
