import type { Activity } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const typeLabels: Record<Activity["type"], string> = {
  call: "Звонок",
  message: "Сообщение",
  note: "Заметка",
  system: "Система",
  status_change: "Статус",
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>История активности</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="relative space-y-4 border-l border-neutral-200 pl-4">
          {activities.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-neutral-400" />
              <p className="text-sm">{a.content}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {typeLabels[a.type]} · {new Date(a.created_at).toLocaleString("ru-RU")}
              </p>
            </li>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-neutral-500">Активности пока нет</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
