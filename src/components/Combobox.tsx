import { useEffect, useState, type KeyboardEvent } from 'react'
import './Combobox.css'

export type ComboboxOption = {
  value: string
  label: string
}

type ComboboxProps = {
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  required?: boolean
}

const MAX_VISIBLE_OPTIONS = 50

// 追加ライブラリなしの検索可能コンボボックス。入力すると候補が絞り込まれ、
// タップ(またはEnter)で選択する。選択済みの値と表示テキストは常に同期させ、
// 未確定の入力のままフォーカスを外れた場合は選択中の値の表示に戻す。
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  required,
}: ComboboxProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''
  const [query, setQuery] = useState(selectedLabel)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    setQuery(selectedLabel)
  }, [selectedLabel])

  const isShowingSelection = query === selectedLabel
  const filtered = (
    query.trim() === '' || isShowingSelection
      ? options
      : options.filter((o) => o.label.includes(query.trim()))
  ).slice(0, MAX_VISIBLE_OPTIONS)

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleBlur = () => {
    // リスト項目のクリックはmousedownで処理してしまうため、blur自体は
    // 少し遅らせてから閉じる(先にクリックのonSelectを実行させるため)。
    window.setTimeout(() => {
      setIsOpen(false)
      setActiveIndex(-1)
      setQuery(selectedLabel)
    }, 120)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault()
        handleSelect(filtered[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery(selectedLabel)
    }
  }

  return (
    <div className="combobox">
      <input
        type="text"
        className="combobox__input"
        required={required}
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        onFocus={() => {
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="combobox__list">
          {filtered.map((option, index) => (
            <li key={option.value || '(empty)'}>
              <button
                type="button"
                className={index === activeIndex ? 'is-active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
