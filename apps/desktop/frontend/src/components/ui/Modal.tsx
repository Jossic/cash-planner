import React from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, description, children, size = 'md', showCloseButton = true }, ref) => {
    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    }

    if (!isOpen) return null

    return (
      <div className="modal-overlay animate-in" onClick={onClose}>
        <div
          ref={ref}
          className={clsx('modal animate-in', sizeClasses[size])}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || description || showCloseButton) && (
            <div className="modal-header">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {title && <h2 className="modal-title">{title}</h2>}
                  {description && <p className="modal-description mt-1">{description}</p>}
                </div>
                {showCloseButton && (
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('modal-footer', className)} {...props} />
  )
)
ModalFooter.displayName = 'ModalFooter'

export { Modal, ModalFooter }