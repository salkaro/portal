import { SettingsNav } from '@/components/app/settings/settings-nav'
import { PageGuard } from '@/components/guards/page-guard'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageGuard requiredPlan="free">
      <div className="flex h-full">
        <aside className="w-44 shrink-0 border-r border-border p-3">
          <SettingsNav />
        </aside>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </PageGuard>
  )
}
