import type { IntegrationProvider } from '@/constants/integrations'
import type { Integration } from '@/lib/integrations/types'
import { MondayIntegration } from '@/lib/integrations/monday'
import { ClickupIntegration } from '@/lib/integrations/clickup'
import { AsanaIntegration } from '@/lib/integrations/asana'
import { LinearIntegration } from '@/lib/integrations/linear'
import { JiraIntegration } from '@/lib/integrations/jira'

export const integrationsRegistry: Record<IntegrationProvider, Integration> = {
    monday: MondayIntegration,
    clickup: ClickupIntegration,
    asana: AsanaIntegration,
    linear: LinearIntegration,
    jira: JiraIntegration,
}
