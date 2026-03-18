import * as React from "react"
import { Card, CardContent, CardTitle } from "./card"
import { cn } from "../../lib/utils"

const Dialog = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, open, onOpenChange, children, ...props }, ref) => {
  React.useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60"
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-2 sm:p-4",
          className,
        )}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onOpenChange?.(false)
          }
        }}
        {...props}
      >
        {children}
      </div>
    </>
  )
})
Dialog.displayName = "Dialog"

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("w-full max-w-lg max-h-[calc(100dvh-1rem)] overflow-hidden", className)}
    onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
    {...props}
  >
    <CardContent className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto p-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)] sm:p-6">
      {children}
    </CardContent>
  </Card>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

export { Dialog, DialogContent, DialogHeader, DialogTitle }
