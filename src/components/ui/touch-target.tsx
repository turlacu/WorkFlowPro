import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * TouchTarget component ensures minimum 44px touch target size
 * according to WCAG 2.1 AA accessibility guidelines
 */
export interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Minimum touch target size in pixels, defaults to 44 */
  minSize?: number;
  /** Whether to apply touch target as inline or block element */
  inline?: boolean;
}

const TouchTarget = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  ({ className, children, minSize = 44, inline = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Ensure minimum touch target size
          `min-h-[${minSize}px] min-w-[${minSize}px]`,
          // Center content within touch target
          "flex items-center justify-center",
          // Touch optimization
          "touch-manipulation",
          // Display type
          inline ? "inline-flex" : "flex",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TouchTarget.displayName = "TouchTarget"

/**
 * TouchableArea wrapper for making any element touch-friendly
 * Adds proper spacing and minimum dimensions for touch interaction
 */
export interface TouchableAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Additional padding around the touchable area */
  padding?: "sm" | "md" | "lg";
}

const TouchableArea = React.forwardRef<HTMLDivElement, TouchableAreaProps>(
  ({ className, children, padding = "md", ...props }, ref) => {
    const paddingClasses = {
      sm: "p-2",
      md: "p-3",
      lg: "p-4"
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Base touchable area styles
          "min-h-[44px] touch-manipulation",
          // Responsive padding
          paddingClasses[padding],
          // Enhanced focus and active states
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "active:scale-[0.98] transition-transform duration-75",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TouchableArea.displayName = "TouchableArea"

export { TouchTarget, TouchableArea }