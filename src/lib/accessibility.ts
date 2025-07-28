import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Accessibility utilities for touch targets and mobile interactions
 * Following WCAG 2.1 AA guidelines
 */

/**
 * Minimum touch target size according to WCAG 2.1 AA (44x44px)
 */
export const TOUCH_TARGET_SIZE = 44

/**
 * Class names for ensuring touch-friendly interactive elements
 */
export const touchTargetClasses = {
  // Minimum touch target size
  minSize: `min-h-[${TOUCH_TARGET_SIZE}px] min-w-[${TOUCH_TARGET_SIZE}px]`,
  
  // Touch optimization
  optimization: "touch-manipulation select-none",
  
  // Enhanced focus states for accessibility
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  
  // Active states for touch feedback
  active: "active:scale-95 transition-transform duration-75",
  
  // Spacing for touch targets
  spacing: {
    sm: "gap-2 sm:gap-1",
    md: "gap-3 sm:gap-2", 
    lg: "gap-4 sm:gap-3"
  }
}

/**
 * Generate touch-friendly classes for interactive elements
 */
export function touchTarget(...inputs: ClassValue[]) {
  return twMerge(clsx(
    touchTargetClasses.minSize,
    touchTargetClasses.optimization,
    touchTargetClasses.focus,
    touchTargetClasses.active,
    inputs
  ))
}

/**
 * Generate classes for touch-friendly button groups
 */
export function touchButtonGroup(spacing: "sm" | "md" | "lg" = "md", ...inputs: ClassValue[]) {
  return twMerge(clsx(
    "flex flex-wrap",
    touchTargetClasses.spacing[spacing],
    inputs
  ))
}

/**
 * Generate classes for touch-friendly form fields
 */
export function touchFormField(...inputs: ClassValue[]) {
  return twMerge(clsx(
    // Enhanced height for touch
    "h-12 sm:h-10",
    // Touch optimization
    touchTargetClasses.optimization,
    // Enhanced focus states
    touchTargetClasses.focus,
    // Responsive text sizing
    "text-base sm:text-sm",
    inputs
  ))
}

/**
 * Generate classes for touch-friendly table cells with interactive elements
 */
export function touchTableCell(...inputs: ClassValue[]) {
  return twMerge(clsx(
    // Minimum height for touch targets
    `min-h-[${TOUCH_TARGET_SIZE}px]`,
    // Adequate padding
    "p-3 sm:p-2",
    // Touch optimization
    touchTargetClasses.optimization,
    inputs
  ))
}

/**
 * Generate classes for touch-friendly card actions
 */
export function touchCardActions(spacing: "sm" | "md" | "lg" = "md", ...inputs: ClassValue[]) {
  return twMerge(clsx(
    "flex flex-wrap items-center",
    touchTargetClasses.spacing[spacing],
    // Ensure adequate padding around action area
    "p-3 sm:p-2",
    inputs
  ))
}

/**
 * Responsive breakpoints for touch vs desktop optimizations
 */
export const breakpoints = {
  mobile: "sm:max-w-sm",
  tablet: "md:max-w-md", 
  desktop: "lg:max-w-lg"
}

/**
 * Generate responsive classes that are touch-friendly on mobile but compact on desktop
 */
export function responsiveTouch(mobileClasses: string, desktopClasses: string) {
  return `${mobileClasses} sm:${desktopClasses}`
}

/**
 * Common touch-friendly component size variants
 */
export const touchSizes = {
  icon: {
    mobile: "h-12 w-12",
    desktop: "sm:h-10 sm:w-10"
  },
  button: {
    mobile: "h-12 px-4",
    desktop: "sm:h-10 sm:px-3"
  },
  input: {
    mobile: "h-12 px-4",
    desktop: "sm:h-10 sm:px-3"
  }
}

/**
 * Generate size classes for touch-friendly elements
 */
export function touchSize(variant: keyof typeof touchSizes, ...inputs: ClassValue[]) {
  const sizes = touchSizes[variant]
  return twMerge(clsx(
    sizes.mobile,
    sizes.desktop,
    inputs
  ))
}