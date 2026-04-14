// Status badge based on anime estado value
export const STATUS_CONFIG = {
  Going:   { label: 'Going',   className: 'badge-going' },
  Finish:  { label: 'Finish',  className: 'badge-finish' },
  Waiting: { label: 'Waiting', className: 'badge-waiting' },
  Desc:    { label: 'Desc',    className: 'badge-desc' },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status ?? '—', className: 'badge-desc' }
  return (
    <span className={config.className}>
      {config.label}
    </span>
  )
}
