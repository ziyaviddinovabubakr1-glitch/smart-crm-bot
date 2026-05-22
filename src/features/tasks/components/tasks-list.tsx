"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { TaskWithContext } from "@/types";
import { TASK_PRIORITIES, TASK_TYPES } from "@/config/constants";
import { completeTaskAction } from "@/features/tasks/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priorityColor = Object.fromEntries(TASK_PRIORITIES.map((p) => [p.value, p.color]));
const typeLabel = Object.fromEntries(TASK_TYPES.map((t) => [t.value, t.label]));

export function TasksList({ tasks, canWrite }: { tasks: TaskWithContext[]; canWrite: boolean }) {
  const [pending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-12 text-center">
        <p className="text-neutral-500">Задач пока нет. Создайте первую через форму выше.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const overdue =
          task.status === "pending" &&
          task.due_date &&
          new Date(task.due_date) < new Date();

        return (
          <div
            key={task.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
              overdue ? "border-danger/30 bg-red-50/30" : "border-neutral-200"
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={priorityColor[task.priority]}>{task.priority}</Badge>
                <Badge>{typeLabel[task.type] ?? task.type}</Badge>
                {task.status === "done" && <Badge className="bg-success/10 text-success">Готово</Badge>}
                {overdue && <Badge className="bg-danger/10 text-danger">Просрочено</Badge>}
              </div>
              <p className="mt-2 font-medium">{task.title}</p>
              {task.description && (
                <p className="mt-1 text-sm text-neutral-500">{task.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                {task.due_date && (
                  <span>Дедлайн: {new Date(task.due_date).toLocaleString("ru-RU")}</span>
                )}
                {task.client_name && (
                  <Link href={`/clients/${task.client_id}`} className="text-primary hover:underline">
                    {task.client_name}
                  </Link>
                )}
                {task.lead_name && (
                  <Link href={`/leads/${task.lead_id}`} className="text-primary hover:underline">
                    {task.lead_name}
                  </Link>
                )}
              </div>
            </div>
            {canWrite && task.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await completeTaskAction(task.id);
                  })
                }
              >
                Выполнено
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
