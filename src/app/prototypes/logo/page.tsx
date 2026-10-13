import type { Metadata } from 'next'

import { LogoLab } from '../_logo/logo-lab'

export const metadata: Metadata = { title: 'Logo' }

export default function LogoPage() {
  return <LogoLab />
}
