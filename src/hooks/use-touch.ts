"use client"

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for detecting touch device capabilities and managing touch interactions
 */
export function useTouch() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isLargeTouch, setIsLargeTouch] = useState(false)

  useEffect(() => {
    // Detect if device supports touch
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsTouchDevice(hasTouchSupport)

    // Detect if device has large touch targets (tablets, phones)
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    setIsLargeTouch(mediaQuery.matches)

    const handleResize = (e: MediaQueryListEvent) => {
      setIsLargeTouch(e.matches)
    }

    mediaQuery.addEventListener('change', handleResize)
    return () => mediaQuery.removeEventListener('change', handleResize)
  }, [])

  return {
    isTouchDevice,
    isLargeTouch,
    needsLargeTouchTargets: isTouchDevice && isLargeTouch
  }
}

/**
 * Hook for managing touch-safe interactions and preventing accidental touches
 */
export function useTouchSafe() {
  const [isProcessingTouch, setIsProcessingTouch] = useState(false)

  const handleTouchSafeClick = useCallback((
    handler: () => void, 
    delay: number = 150
  ) => {
    if (isProcessingTouch) return

    setIsProcessingTouch(true)
    handler()

    // Prevent rapid successive touches
    setTimeout(() => {
      setIsProcessingTouch(false)
    }, delay)
  }, [isProcessingTouch])

  return {
    isProcessingTouch,
    handleTouchSafeClick
  }
}

/**
 * Hook for managing touch ripple effects
 */
export function useTouchRipple() {
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([])

  const addRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left
    const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }, [])

  const clearRipples = useCallback(() => {
    setRipples([])
  }, [])

  return {
    ripples,
    addRipple,
    clearRipples
  }
}

/**
 * Hook for managing accessible focus and keyboard navigation
 */
export function useAccessibleFocus() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return {
    isKeyboardUser,
    focusClasses: isKeyboardUser ? 'focus-visible:ring-2 focus-visible:ring-ring' : ''
  }
}

/**
 * Combined hook for comprehensive touch and accessibility features
 */
export function useTouchAccessibility() {
  const touch = useTouch()
  const touchSafe = useTouchSafe()
  const focus = useAccessibleFocus()

  return {
    ...touch,
    ...touchSafe,
    ...focus,
    // Recommended classes based on device capabilities
    getButtonClasses: () => {
      const baseClasses = 'touch-manipulation transition-all duration-75'
      const sizeClasses = touch.needsLargeTouchTargets ? 'min-h-[44px] min-w-[44px]' : ''
      const focusClasses = focus.focusClasses
      const activeClasses = touch.isTouchDevice ? 'active:scale-95' : 'hover:scale-105'
      
      return `${baseClasses} ${sizeClasses} ${focusClasses} ${activeClasses}`.trim()
    },
    
    getInputClasses: () => {
      const baseClasses = 'touch-manipulation'
      const sizeClasses = touch.needsLargeTouchTargets ? 'h-12 text-base' : 'h-10 text-sm'
      const focusClasses = focus.focusClasses
      
      return `${baseClasses} ${sizeClasses} ${focusClasses}`.trim()
    },
    
    getSpacingClasses: () => {
      return touch.needsLargeTouchTargets ? 'gap-3' : 'gap-2'
    }
  }
}