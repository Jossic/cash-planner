import React from 'react'
import { clsx } from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'currency' | 'percentage'
}

/**
 * Modern Input Component for JLA Cash Planner
 * Uses the new design system with proper focus states and business styling
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, required, leftIcon, rightIcon, variant = 'default', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="form-group">
        {label && (
          <label 
            htmlFor={inputId} 
            className={clsx(
              'form-label',
              required && 'form-label-required'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={clsx(
              'form-input',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              variant === 'currency' && 'font-mono text-green-400',
              variant === 'percentage' && 'font-mono text-orange-400',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-400 flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2 text-xs font-bold text-white">!</span>
              {error}
            </p>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }