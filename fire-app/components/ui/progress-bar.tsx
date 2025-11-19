"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: "primary" | "secondary" | "success" | "warning" | "fire-red" | "fire-gold"
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

const colorMap = {
  primary: "bg-fire-red",
  secondary: "bg-fire-gold",
  success: "bg-green-500",
  warning: "bg-orange-500",
  "fire-red": "bg-fire-red",
  "fire-gold": "bg-fire-gold",
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
          "overflow-hidden rounded-full bg-white/10",
          sizeMap[size]
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            color === "fire-red" ? "from-red-500 to-red-600" : "",
            color === "fire-gold" ? "from-yellow-400 to-yellow-500" : "",
            color === "primary" ? "from-fire-red to-red-700" : "",
            color === "secondary" ? "from-fire-gold to-yellow-500" : "",
            color === "success" ? "from-green-400 to-green-500" : "",
            color === "warning" ? "from-orange-400 to-orange-500" : ""
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