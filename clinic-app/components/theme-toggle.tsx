"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Theme:</span>
      <div className="flex items-center space-x-1 rounded-lg border border-border p-1">
        <button
          onClick={() => setTheme("light")}
          className={`rounded-md p-1.5 transition-colors ${
            theme === "light"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          aria-label="Light mode"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`rounded-md p-1.5 transition-colors ${
            theme === "dark"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          aria-label="Dark mode"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`rounded-md p-1.5 transition-colors ${
            theme === "system"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          aria-label="System theme"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}