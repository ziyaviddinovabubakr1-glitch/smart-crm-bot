import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
          {siteConfig.shortName[0]}
        </div>
        <h1 className="text-2xl font-semibold">{siteConfig.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{siteConfig.description}</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
