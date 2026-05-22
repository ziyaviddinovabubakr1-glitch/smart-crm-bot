"use client";

import { useState } from "react";
import { changePasswordAction } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      action={async (fd) => {
        const result = await changePasswordAction(fd);
        if (result.ok) setMessage("Пароль успешно изменён");
        else if (result.error === "invalid_current") setMessage("Неверный текущий пароль");
        else if (result.error === "weak_password") setMessage("Новый пароль должен быть ≥ 6 символов");
        else if (result.error === "mismatch") setMessage("Пароли не совпадают");
        else setMessage("Не удалось изменить пароль");
      }}
      className="space-y-3"
    >
      <div>
        <Label htmlFor="current_password">Текущий пароль</Label>
        <Input id="current_password" name="current_password" type="password" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="new_password">Новый пароль</Label>
        <Input id="new_password" name="new_password" type="password" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="confirm_password">Подтверждение</Label>
        <Input id="confirm_password" name="confirm_password" type="password" required className="mt-1" />
      </div>
      <Button type="submit">Сменить пароль</Button>
      {message && <p className="text-sm text-neutral-600">{message}</p>}
    </form>
  );
}
