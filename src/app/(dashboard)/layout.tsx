import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { LivingBackground } from "@/components/ui/LivingBackground";
import { registerAutomationHandlers } from "@/modules/automation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUserById } from "@/services/users";
import { getUnreadNotificationCount } from "@/services/notifications";

registerAutomationHandlers();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getUserById(session.user.id);

  if (user && !user.onboarding_completed) {
    redirect("/onboarding");
  }

  const backgroundType = user?.background_preference ?? "aurora";
  let unreadNotifications = 0;
  try {
    unreadNotifications = await getUnreadNotificationCount(session.user.id);
  } catch {
    unreadNotifications = 0;
  }

  return (
    <LivingBackground type={backgroundType} opacity={0.25}>
      <DashboardShell session={session.user} unreadNotifications={unreadNotifications}>
        <div className="min-h-screen bg-white/80 backdrop-blur-xl dark:bg-gray-900/80">
          {children}
        </div>
      </DashboardShell>
    </LivingBackground>
  );
}
