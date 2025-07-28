"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Enhanced touch targets and mobile optimization
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      // Touch-friendly sizing - larger on mobile
      "h-7 w-12 sm:h-6 sm:w-11", // Larger switch on mobile
      // Touch optimization
      "touch-manipulation",
      // Enhanced active states for mobile
      "active:scale-95 transition-all duration-100",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Responsive thumb sizing
        "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
        "h-6 w-6 sm:h-5 sm:w-5", // Larger thumb on mobile
        "data-[state=checked]:translate-x-5 sm:data-[state=checked]:translate-x-5", // Adjust translation for larger mobile size
        "data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
