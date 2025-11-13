"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: "primary" | "secondary" | "success" | "warning" | "phase-analyze" | "phase-mobilize" | "phase-stabilize" | "phase-optimize"
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

const colorMap = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  "phase-analyze": "bg-phase-analyze",
  "phase-mobilize": "bg-phase-mobilize",
  "phase-stabilize": "bg-phase-stabilize",
  "phase-optimize": "bg-phase-optimize",
}

const sizeMap = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color = "primary",
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          sizeMap[size]
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            colorMap[color]
          )}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.5 : 0,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
  )
}