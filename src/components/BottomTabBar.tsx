import { NavLink } from 'react-router-dom'
import './BottomTabBar.css'

const TABS = [
  { to: '/map', label: 'マップ' },
  { to: '/stats', label: '統計' },
  { to: '/settings', label: '設定' },
]

export function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
