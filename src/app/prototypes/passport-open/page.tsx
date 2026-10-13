import type { Metadata } from 'next'

import { PassportAbout } from '../_passport/passport-about'

export const metadata: Metadata = { title: 'Passport — open' }

export default function PassportOpenPage() {
  return <PassportAbout key="open" initialOpen />
}
