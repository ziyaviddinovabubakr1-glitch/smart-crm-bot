"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Client } from "@/types";
import { clientFullName } from "@/lib/db/mappers";
import { createDealFormAction } from "@/features/deals/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CreateDealDialog({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Новая сделка
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="font-semibold">Новая сделка</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={createDealFormAction} className="space-y-4 p-5">
          <div>
            <Label htmlFor="client_id">Клиент</Label>
            <Select id="client_id" name="client_id" required className="mt-1 w-full">
              <option value="">Выберите клиента</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {clientFullName(client)} · {client.phone}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="title">Название</Label>
            <Input id="title" name="title" required defaultValue="Новая сделка" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Сумма</Label>
              <Input id="amount" name="amount" type="number" min="0" defaultValue="0" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="currency">Валюта</Label>
              <Input id="currency" name="currency" defaultValue="RUB" className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
