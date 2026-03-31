'use client'

import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5 gap-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
