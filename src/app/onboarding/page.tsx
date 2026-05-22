import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { getUserById } from "@/services/users";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/onboarding");
  }

  const user = await getUserById(session.id);
  if (user?.onboarding_completed) {
    redirect("/dashboard");
  }

  return <OnboardingWizard />;
}
