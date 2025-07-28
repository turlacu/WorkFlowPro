import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-offset-2",
  // Enhanced touch-friendly sizing and spacing
  "px-3 py-1 sm:px-2.5 sm:py-0.5", // More padding on mobile
  "text-sm sm:text-xs", // Larger text on mobile
  // Touch optimization
  "touch-manipulation",
  // Enhanced active states for interactive badges
  "active:scale-95 transition-all duration-75",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Whether the badge is interactive (clickable) */
  interactive?: boolean;
}

function Badge({ className, variant, interactive = false, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant }), 
        // Add cursor pointer and hover effects for interactive badges
        interactive && "cursor-pointer hover:scale-105",
        // Ensure minimum touch target for interactive badges
        interactive && "min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto",
        className
      )} 
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
