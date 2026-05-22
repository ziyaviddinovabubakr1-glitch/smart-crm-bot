"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Вход в систему</CardTitle>
        <p className="text-sm text-neutral-500">
          {siteConfig.name} — доступ по ролям
        </p>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/login" method="POST" className="space-y-4">
          <input type="hidden" name="next" value={next} />

          {error === "invalid" && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Неверный email или пароль
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue="admin@local.dev"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              defaultValue="admin123"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full">
            Войти
          </Button>
          <p className="text-xs text-neutral-500">
            По умолчанию: admin@local.dev / admin123
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
