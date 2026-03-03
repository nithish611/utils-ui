import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import TagInput from '../../../components/ui/TagInput'
import {
  SERVICE_TYPES,
  ENVIRONMENTS,
  AWS_REGIONS,
  SERVICE_TYPE_LABELS,
} from '../types'
import type { ServiceEntry, ServiceEntryFormData } from '../types'

interface ServiceFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ServiceEntryFormData) => void
  editingService?: ServiceEntry | null
  existingTags: string[]
}

const emptyForm: ServiceEntryFormData = {
  name: '',
  url: '',
  serviceType: 'lambda',
  region: 'us-east-1',
  environment: 'dev',
  tags: [],
}

export default function ServiceFormModal({
  open,
  onClose,
  onSubmit,
  editingService,
  existingTags,
}: ServiceFormModalProps) {
  const [form, setForm] = useState<ServiceEntryFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceEntryFormData, string>>>({})

  useEffect(() => {
    if (open) {
      if (editingService) {
        setForm({
          name: editingService.name,
          url: editingService.url,
          serviceType: editingService.serviceType,
          region: editingService.region,
          environment: editingService.environment,
          tags: editingService.tags,
        })
      } else {
        setForm(emptyForm)
      }
      setErrors({})
    }
  }, [open, editingService])

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.url.trim()) {
      newErrors.url = 'URL is required'
    } else {
      try {
        new URL(form.url)
      } catch {
        newErrors.url = 'Must be a valid URL'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit(form)
      onClose()
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-amber-accent/50 focus:ring-1 focus:ring-amber-accent/20'
  const labelClasses = 'block mb-1.5 text-xs font-medium text-slate-400'
  const errorClasses = 'mt-1 text-xs text-red-400'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingService ? 'Edit Service' : 'Add Service'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClasses}>Service Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. order-processor-lambda"
            className={inputClasses}
            autoFocus
          />
          {errors.name && <p className={errorClasses}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelClasses}>AWS Console URL</label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://console.aws.amazon.com/..."
            className={inputClasses}
          />
          {errors.url && <p className={errorClasses}>{errors.url}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClasses}>Service Type</label>
            <select
              value={form.serviceType}
              onChange={(e) =>
                setForm({ ...form, serviceType: e.target.value as typeof form.serviceType })
              }
              className={`${inputClasses} cursor-pointer`}
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SERVICE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Environment</label>
            <select
              value={form.environment}
              onChange={(e) =>
                setForm({ ...form, environment: e.target.value as typeof form.environment })
              }
              className={`${inputClasses} cursor-pointer`}
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className={`${inputClasses} cursor-pointer`}
            >
              {AWS_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Tags</label>
          <TagInput
            tags={form.tags}
            onChange={(tags) => setForm({ ...form, tags })}
            suggestions={existingTags}
            placeholder="Type and press Enter to add tags"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {editingService ? 'Save Changes' : 'Add Service'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
