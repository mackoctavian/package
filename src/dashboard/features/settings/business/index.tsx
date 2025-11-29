import { ContentSection } from '../components/content-section'
import { BusinessForm } from './business-form'

export function SettingsBusiness() {
  return (
    <ContentSection
      title='Business'
      desc='Update your business name and keep location names in sync.'
    >
      <BusinessForm />
    </ContentSection>
  )
}

