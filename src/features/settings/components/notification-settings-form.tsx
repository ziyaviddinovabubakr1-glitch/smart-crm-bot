"use client";

import type { UserNotificationSettings } from "@/types";
import { updateNotificationSettingsAction } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function NotificationSettingsForm({
  settings,
}: {
  settings: UserNotificationSettings;
}) {
  return (
    <form action={updateNotificationSettingsAction} className="space-y-3 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="email_enabled" defaultChecked={settings.email_enabled} />
        <span>Email-уведомления (заглушка — пишет в лог сервера)</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="in_app_enabled"
          defaultChecked={settings.in_app_enabled}
        />
        <span>Внутри системы (заглушка)</span>
      </label>
      <Button type="submit" variant="outline">
        Сохранить уведомления
      </Button>
    </form>
  );
}
