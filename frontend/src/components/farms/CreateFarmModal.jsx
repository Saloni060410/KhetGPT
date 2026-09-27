import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import FormField from '../ui/FormField.jsx'
import { useFarmStore } from '../../store/useFarmStore.js'
import { Sprout } from 'lucide-react'

export default function CreateFarmModal({ isOpen, onClose, onSuccess, onError }) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const { createFarmOptimistic } = useFarmStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setFormError('Farm name is required.')
      return
    }

    if (trimmed.length < 2) {
      setFormError('Farm name must be at least 2 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      // Optimistic create handles adding immediately to store and rolling back if failed
      const created = await createFarmOptimistic({ name: trimmed })
      setName('')
      onClose?.()
      onSuccess?.(created)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create farm'
      setFormError(msg)
      onError?.(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setFormError(null)
    onClose?.()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Farm"
      description="Create a farm profile to organize your fields and plots."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <FormField
          label="Farm Name"
          hint="e.g. Kisan Vikas Farm, Greenfield Estate"
          error={formError}
          required
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter farm name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (formError) setFormError(null)
              }}
              autoFocus
              className="pl-9"
            />
            <Sprout className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          </div>
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!name.trim()}
          >
            Create Farm
          </Button>
        </div>
      </form>
    </Modal>
  )
}
