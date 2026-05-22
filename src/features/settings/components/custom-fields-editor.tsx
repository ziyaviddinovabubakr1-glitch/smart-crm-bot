"use client";

import type { ClientFieldDefinition } from "@/types";
import { addCustomFieldAction, deleteCustomFieldAction } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CustomFieldsEditor({ fields }: { fields: ClientFieldDefinition[] }) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div
          key={field.id}
          className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm"
        >
          <div>
            <p className="font-medium">{field.label}</p>
            <p className="text-xs text-neutral-500">
              {field.field_key} · {field.field_type}
              {field.options.length > 0 && ` · ${field.options.join(", ")}`}
            </p>
          </div>
          <form action={deleteCustomFieldAction}>
            <input type="hidden" name="id" value={field.id} />
            <Button type="submit" variant="outline" size="sm">
              Удалить
            </Button>
          </form>
        </div>
      ))}

      <form action={addCustomFieldAction} className="grid gap-2 border-t pt-4 sm:grid-cols-2">
        <div>
          <Label>Ключ поля</Label>
          <Input name="field_key" placeholder="budget" required className="mt-1" />
        </div>
        <div>
          <Label>Название</Label>
          <Input name="label" placeholder="Бюджет" required className="mt-1" />
        </div>
        <div>
          <Label>Тип</Label>
          <Select name="field_type" className="mt-1 w-full" defaultValue="text">
            <option value="text">Текст</option>
            <option value="number">Число</option>
            <option value="date">Дата</option>
            <option value="select">Список</option>
          </Select>
        </div>
        <div>
          <Label>Варианты (через запятую)</Label>
          <Input name="options" placeholder="Низкий, Средний, Высокий" className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit">Добавить поле</Button>
        </div>
      </form>
    </div>
  );
}
