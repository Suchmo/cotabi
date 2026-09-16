import { NavLink } from 'react-router-dom'
import { Map, BarChart3, Settings } from 'lucide-react'
import './BottomTabBar.css'

const TABS = [
  { to: '/map', label: 'マップ', Icon: Map },
  { to: '/stats', label: '統計', Icon: BarChart3 },
  { to: '/settings', label: '設定', Icon: Settings },
]

export function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to}>
          <Icon size={22} strokeWidth={1.5} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
