"use client";

import { PageHeader } from "./page-header";
import { useMobileNav } from "./mobile-nav-context";

interface DashboardPageFrameProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardPageFrame({
  title,
  description,
  actions,
  children,
}: DashboardPageFrameProps) {
  const { toggleMenu } = useMobileNav();

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        onMenuClick={toggleMenu}
      />
      {children}
    </>
  );
}
