import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

type SidebarNavItem = {
  label: string
  href: string
  active?: boolean
}

type SidebarNavProps = {
  title: string
  items: SidebarNavItem[]
  helper?: string
  chips?: string[]
}

export function SidebarNav({ title, helper, items, chips }: SidebarNavProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-outline">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </p>
          {helper && <p className="text-sm text-muted-foreground">{helper}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => {
          const isAnchor = item.href.startsWith("#")
          const baseClasses = cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground",
            item.active && "bg-secondary text-foreground shadow-outline",
          )
          if (isAnchor) {
            return (
              <a key={item.href + item.label} href={item.href} className={baseClasses}>
                <span>{item.label}</span>
              </a>
            )
          }
          return (
            <Link key={item.href + item.label} to={item.href} className={baseClasses}>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {chips && chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
