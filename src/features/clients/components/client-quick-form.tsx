"use client";

import { useActionState } from "react";
import {
  submitClientQuickForm,
  type CreateClientFormState,
} from "@/features/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "@/config/constants";

export function ClientQuickForm() {
  const [state, formAction, pending] = useActionState<CreateClientFormState, FormData>(
    submitClientQuickForm,
    null
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      {state?.error && (
        <p className="sm:col-span-2 lg:col-span-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <Label htmlFor="first_name">Имя *</Label>
        <Input id="first_name" name="first_name" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="phone">Телефон *</Label>
        <Input id="phone" name="phone" required className="mt-1" placeholder="+7..." />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="company">Компания</Label>
        <Input id="company" name="company" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="source">Источник</Label>
        <Select id="source" name="source" className="mt-1 w-full" defaultValue="manual">
          {CLIENT_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Статус</Label>
        <Select id="status" name="status" className="mt-1 w-full" defaultValue="new">
          {CLIENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
