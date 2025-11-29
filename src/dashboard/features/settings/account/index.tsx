import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc='Review and update your profile details, contact information, passcode, and PIN.'
    >
      <AccountForm />
    </ContentSection>
  )
}

