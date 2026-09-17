import './ConfirmDialog.css'

type ConfirmDialogProps = {
  open: boolean
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

// 削除など取り消せない操作の前に必ず挟む確認ダイアログ。今後スポットや
// 旅行(あるいは他のデータ)に新しい削除操作を追加する際は、window.confirm()を
// 直接呼ぶのではなく、必ずこのコンポーネントを使うこと(確認を付け忘れることを防ぐ)。
// design_system.mdのトーンに合わせた見た目にするため、ブラウザ標準の
// window.confirm()は使わない。
export function ConfirmDialog({
  open,
  message,
  confirmLabel = '削除する',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="confirm-dialog__backdrop" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-dialog__confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
