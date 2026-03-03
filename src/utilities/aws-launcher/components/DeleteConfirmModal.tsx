import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  serviceName: string
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  serviceName,
}: DeleteConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Service" maxWidth="max-w-sm">
      <p className="text-sm text-slate-400">
        Are you sure you want to delete{' '}
        <span className="font-mono font-semibold text-slate-200">{serviceName}</span>?
        This action cannot be undone.
      </p>
      <div className="mt-5 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          Delete
        </Button>
      </div>
    </Modal>
  )
}
