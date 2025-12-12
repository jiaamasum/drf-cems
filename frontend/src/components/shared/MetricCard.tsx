import type { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  label: string
  value: string | number
  helper?: string
  tag?: string
  icon?: ReactNode
  tone?: "default" | "success" | "accent" | "warning"
}

const toneMap: Record<
  NonNullable<MetricCardProps["tone"]>,
  { badge: string; dot: string }
> = {
  default: {
    badge: "bg-secondary text-secondary-foreground",
    dot: "bg-primary/60",
  },
  success: {
    badge: "bg-success/15 text-success-foreground",
    dot: "bg-success",
  },
  accent: {
    badge: "bg-accent/15 text-accent-foreground",
    dot: "bg-accent",
  },
  warning: {
    badge: "bg-warning/15 text-warning-foreground",
    dot: "bg-warning",
  },
}

export function MetricCard({
  label,
  value,
  helper,
  tag,
  icon,
  tone = "default",
}: MetricCardProps) {
  const toneStyles = toneMap[tone]
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-none p-4">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", toneStyles.dot)} />
          <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        </div>
        {icon ?? <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="space-y-2 pb-5">
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        {helper && <p className="text-sm text-muted-foreground">{helper}</p>}
        {tag && (
          <Badge className={toneStyles.badge} variant="outline">
            {tag}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
