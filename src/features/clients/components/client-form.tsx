"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClientAction } from "@/features/clients/actions";
import { Confetti } from "@/components/ui/confetti";
import { useToast } from "@/components/ui/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "@/config/constants";

interface ClientFormProps {
  onSuccess?: (clientId: string, searchName?: string) => void;
  onCancel?: () => void;
}

export function ClientForm({ onSuccess, onCancel }: ClientFormProps) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const pendingClientId = useRef<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  async function checkDuplicates(phone: string, email: string) {
    if (!phone.trim() && !email.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const params = new URLSearchParams();
    if (phone.trim()) params.set("phone", phone.trim());
    if (email.trim()) params.set("email", email.trim());
    const res = await fetch(`/api/clients/check-duplicate?${params}`);
    const data = (await res.json()) as { duplicates: { id: string; first_name: string; last_name: string }[] };
    if (data.duplicates?.length) {
      const names = data.duplicates.map((d) => `${d.first_name} ${d.last_name}`.trim()).join(", ");
      setDuplicateWarning(`Возможный дубликат: ${names}`);
    } else {
      setDuplicateWarning(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createClientAction(formData);

      if (result.success && result.data) {
        const clientId = result.data.id;
        const searchName = result.data.first_name.trim();
        pendingClientId.current = clientId;
        toast.success(result.message || "Клиент создан!");
        formRef.current?.reset();
        setShowConfetti(true);
        router.refresh();
        if (onSuccess) {
          onSuccess(clientId, searchName);
        } else {
          const params = new URLSearchParams({ view: "table", created: clientId });
          if (searchName) params.set("search", searchName);
          router.push(`/clients?${params.toString()}`);
        }
        return;
      }

      toast.error(result.error || "Произошла ошибка");
    } catch {
      toast.error("Неожиданная ошибка. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          onComplete={() => {
            setShowConfetti(false);
            pendingClientId.current = null;
          }}
        />
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-neutral-200/80 bg-white/90 p-4 backdrop-blur-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Имя *</Label>
            <Input id="firstName" name="firstName" type="text" required placeholder="Иван" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Фамилия</Label>
            <Input id="lastName" name="lastName" type="text" placeholder="Иванов" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+79001234567"
              onBlur={(e) => {
                const email = (formRef.current?.querySelector("#email") as HTMLInputElement)?.value ?? "";
                void checkDuplicates(e.target.value, email);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ivan@example.com"
              onBlur={(e) => {
                const phone = (formRef.current?.querySelector("#phone") as HTMLInputElement)?.value ?? "";
                void checkDuplicates(phone, e.target.value);
              }}
            />
          </div>

          {duplicateWarning && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-amber-900 sm:col-span-2">
              {duplicateWarning}
            </div>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company">Компания</Label>
            <Input id="company" name="company" type="text" placeholder="ООО Ромашка" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select id="status" name="status" defaultValue="new">
              {CLIENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Источник</Label>
            <Select id="source" name="source" defaultValue="manual">
              {CLIENT_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSubmitting || showConfetti}>
            {isSubmitting ? "Создание…" : "Создать клиента"}
          </Button>
        </div>
      </form>
    </>
  );
}
