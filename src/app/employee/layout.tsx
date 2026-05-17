'use client';

import { EmployeeAppShell } from '@/components/layout';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeAppShell>{children}</EmployeeAppShell>;
}
