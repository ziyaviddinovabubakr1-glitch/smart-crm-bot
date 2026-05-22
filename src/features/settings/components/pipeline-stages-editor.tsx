"use client";

import type { PipelineStage } from "@/types";
import {
  addStageAction,
  deleteStageAction,
  updateStageAction,
} from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PipelineStagesEditor({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <div key={stage.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-100 p-3">
        <form
          action={updateStageAction}
          className="flex flex-1 flex-wrap items-end gap-2"
        >
          <input type="hidden" name="id" value={stage.id} />
          <div className="min-w-[120px] flex-1">
            <Label>Название</Label>
            <Input name="label" defaultValue={stage.label} className="mt-1" required />
          </div>
          <div className="w-20">
            <Label>Порядок</Label>
            <Input
              name="sort_order"
              type="number"
              defaultValue={stage.sort_order}
              className="mt-1"
            />
          </div>
          <div className="text-xs text-neutral-500 pb-2">{stage.value}</div>
          <Button type="submit" variant="outline" size="sm">
            Сохранить
          </Button>
        </form>
        <form action={deleteStageAction} className="inline">
          <input type="hidden" name="id" value={stage.id} />
          <Button type="submit" variant="outline" size="sm">
            Удалить
          </Button>
        </form>
      </div>
      ))}

      <form action={addStageAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
        <div className="min-w-[140px] flex-1">
          <Label>Новый этап</Label>
          <Input name="label" placeholder="Название этапа" className="mt-1" required />
        </div>
        <div className="min-w-[120px]">
          <Label>Код (необяз.)</Label>
          <Input name="value" placeholder="slug" className="mt-1" />
        </div>
        <Button type="submit">Добавить этап</Button>
      </form>
    </div>
  );
}
