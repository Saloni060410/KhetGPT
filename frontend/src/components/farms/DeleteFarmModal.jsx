import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { AlertTriangle } from 'lucide-react'
import { useFarmStore } from '../../store/useFarmStore.js'

export default function DeleteFarmModal({ isOpen, onClose, farm, onSuccess, onError }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteFarmOptimistic } = useFarmStore()

  if (!farm) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Optimistic delete: removes farm from store immediately, rolls back if error
      await deleteFarmOptimistic(farm.id)
      onClose?.()
      onSuccess?.(`Farm "${farm.name}" removed.`)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete farm'
      onError?.(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Farm"
      description={`Are you sure you want to delete "${farm.name}"?`}
    >
      <div className="space-y-4 mt-1">
        <div className="p-3 rounded-xl bg-risk-high-bg border border-risk-high-border text-xs text-risk-high-text flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-risk-high-text" />
          <div className="leading-relaxed">
            <strong>Warning:</strong> Deleting this farm will also remove all associated fields, plots, soil tests and recommendations from this view. This action cannot be undone.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Yes, Delete Farm
          </Button>
        </div>
      </div>
    </Modal>
  )
}
