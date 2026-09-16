import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './BackLink.css'

type BackLinkProps = {
  to: string
  label: string
}

export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link to={to} className="back-link">
      <ArrowLeft size={14} strokeWidth={1.5} />
      {label}
    </Link>
  )
}
