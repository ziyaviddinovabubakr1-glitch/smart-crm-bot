import { getUsers } from "@/services/users";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { getDb } from "@/lib/db";
import { getClientFieldDefinitions } from "@/services/custom-fields";
import { getNotificationSettings } from "@/services/notifications";
import { getPipelineStages } from "@/services/pipeline-stages";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLES } from "@/config/constants";
import { ChangePasswordForm } from "@/features/settings/components/change-password-form";
import { CustomFieldsEditor } from "@/features/settings/components/custom-fields-editor";
import { NotificationSettingsForm } from "@/features/settings/components/notification-settings-form";
import { PipelineStagesEditor } from "@/features/settings/components/pipeline-stages-editor";

export default async function SettingsPage() {
  const session = await getSession();
  const users = await getUsers();
  const db = getDb();
  const rules = db
    .prepare("SELECT name, trigger, action, enabled FROM automation_rules ORDER BY created_at")
    .all() as { name: string; trigger: string; action: string; enabled: number }[];
  const [stages, fields, notifications] = await Promise.all([
    getPipelineStages(),
    getClientFieldDefinitions(),
    session ? getNotificationSettings(session.id) : null,
  ]);

  const canManage = session && hasPermission(session.role, "users:manage");
  const roleLabel = session
    ? ROLES.find((r) => r.value === session.role)?.label ?? session.role
    : "";

  return (
    <DashboardPageFrame title="Настройки" description="Профиль, воронка, поля, команда">
      <div className="grid gap-6 p-4 lg:grid-cols-2 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {session && (
              <div className="space-y-1">
                <p>
                  <span className="text-neutral-500">Имя:</span> {session.name}
                </p>
                <p>
                  <span className="text-neutral-500">Email:</span> {session.email}
                </p>
                <p>
                  <span className="text-neutral-500">Роль:</span> {roleLabel}
                </p>
              </div>
            )}
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications && <NotificationSettingsForm settings={notifications} />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Этапы воронки</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <PipelineStagesEditor stages={stages} />
            ) : (
              <p className="text-sm text-neutral-500">Доступно только администратору</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Дополнительные поля клиента</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <CustomFieldsEditor fields={fields} />
            ) : (
              <p className="text-sm text-neutral-500">Доступно только администратору</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Команда</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                  {ROLES.find((r) => r.value === user.role)?.label ?? user.role}
                </span>
              </div>
            ))}
            {!canManage && (
              <p className="text-xs text-neutral-500">
                Управление пользователями доступно только администратору.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Правила автоматизации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rules.map((rule, i) => (
              <div
                key={i}
                className="rounded-lg border border-neutral-100 px-3 py-2 text-sm"
              >
                <p className="font-medium">{rule.name}</p>
                <p className="text-xs text-neutral-500">
                  {rule.trigger} → {rule.action}
                  {!rule.enabled && " (выключено)"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Интеграции (мультиканальность)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Telegram", status: "active", hint: "Webhook настроен" },
                { name: "WhatsApp", status: "soon", hint: "Business API" },
                { name: "Instagram", status: "soon", hint: "Direct Messages" },
                { name: "Facebook", status: "soon", hint: "Messenger" },
                { name: "Email", status: "stub", hint: "IMAP/SMTP" },
                { name: "Телефония", status: "soon", hint: "IP-телефония" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3"
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-neutral-500">{item.hint}</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      item.status === "active"
                        ? "bg-success/10 text-success"
                        : item.status === "stub"
                          ? "bg-warning/10 text-warning"
                          : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {item.status === "active" ? "Активно" : item.status === "stub" ? "Заглушка" : "Скоро"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageFrame>
  );
}
