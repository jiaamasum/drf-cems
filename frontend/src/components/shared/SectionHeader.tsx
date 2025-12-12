import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  align?: "start" | "between"
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "between",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center",
        align === "between" && "md:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="max-w-3xl text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
