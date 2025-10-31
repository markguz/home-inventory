import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from './badge'
import { AlertTriangle } from 'lucide-react'

export interface AlertBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'warning' | 'error' | 'info'
  showIcon?: boolean
}

const AlertBadge = React.forwardRef<HTMLDivElement, AlertBadgeProps>(
  ({ className, variant = 'warning', showIcon = true, children, ...props }, ref) => {
    const variantStyles = {
      warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300',
      error: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300',
      info: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300',
    }

    return (
      <Badge
        ref={ref}
        className={cn(
          'flex items-center gap-1 border',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {showIcon && <AlertTriangle className="h-3 w-3" />}
        {children || 'Low Stock'}
      </Badge>
    )
  }
)

AlertBadge.displayName = 'AlertBadge'

export { AlertBadge }
