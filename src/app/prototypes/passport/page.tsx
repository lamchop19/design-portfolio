import type { Metadata } from 'next'

import { PassportAbout } from '../_passport/passport-about'

export const metadata: Metadata = { title: 'Passport — closed' }

export default function PassportPage() {
  return <PassportAbout key="closed" initialOpen={false} />
}
