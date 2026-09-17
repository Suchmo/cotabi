import { useContext } from 'react'
import { LockContext } from '../contexts/LockContext'

export function useLock() {
  return useContext(LockContext)
}
