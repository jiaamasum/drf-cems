import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90",
        primary:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:border-foreground/20 shadow-outline",
        ghost:
          "bg-transparent text-foreground hover:bg-secondary/70 border border-transparent",
        outline:
          "border border-border bg-card text-foreground hover:border-foreground/30 hover:shadow-outline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 hover:bg-destructive/90",
        muted: "bg-muted text-muted-foreground",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
      shape: {
        rounded: "rounded-full",
        default: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
