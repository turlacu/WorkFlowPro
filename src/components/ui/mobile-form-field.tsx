import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

/**
 * MobileFormField component optimized for touch interactions
 * Provides adequate spacing and touch targets according to WCAG guidelines
 */
export interface MobileFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const MobileFormField = React.forwardRef<HTMLDivElement, MobileFormFieldProps>(
  ({ className, label, description, error, required = false, children, ...props }, ref) => {
    const fieldId = React.useId()
    
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-2",
          // Enhanced spacing for mobile touch targets
          "py-2 sm:py-1",
          className
        )}
        {...props}
      >
        {label && (
          <Label 
            htmlFor={fieldId}
            className={cn(
              // Touch-friendly label sizing and spacing
              "text-base sm:text-sm font-medium leading-none",
              // Ensure adequate touch target for label clicks
              "block py-1 px-1",
              // Visual indicator for required fields
              required && "after:content-['*'] after:ml-1 after:text-destructive"
            )}
          >
            {label}
          </Label>
        )}
        
        <div className="space-y-1">
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            'aria-describedby': description || error ? `${fieldId}-description` : undefined,
            'aria-invalid': error ? 'true' : undefined,
            className: cn(
              // Ensure touch-friendly sizing
              "min-h-[44px] sm:min-h-[40px]",
              // Enhanced focus states for mobile
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              (children as React.ReactElement).props?.className
            )
          })}
          
          {(description || error) && (
            <div id={`${fieldId}-description`} className="space-y-1">
              {description && (
                <p className="text-sm text-muted-foreground px-1">
                  {description}
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive px-1 font-medium">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
MobileFormField.displayName = "MobileFormField"

/**
 * FormFieldGroup for grouping related form fields with proper spacing
 */
export interface FormFieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const FormFieldGroup = React.forwardRef<HTMLDivElement, FormFieldGroupProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-4 sm:space-y-3",
          // Enhanced spacing between field groups
          "pb-6 sm:pb-4",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1 pb-2">
            {title && (
              <h3 className="text-lg sm:text-base font-semibold leading-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-4 sm:space-y-3">
          {children}
        </div>
      </div>
    )
  }
)
FormFieldGroup.displayName = "FormFieldGroup"

export { MobileFormField, FormFieldGroup }