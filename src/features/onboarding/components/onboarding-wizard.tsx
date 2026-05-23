"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { LivingBackground } from "@/components/ui/living-background";
import { useToast } from "@/components/ui/toast-provider";
import type {
  BackgroundPreference,
  BusinessType,
  ThemePreference,
  UserIndustry,
} from "@/types";

const steps = [
  { id: 1, title: "Кто вы?" },
  { id: 2, title: "Цели" },
  { id: 3, title: "Сфера" },
  { id: 4, title: "Дизайн" },
];

const businessOptions: { value: BusinessType; label: string; desc: string }[] = [
  { value: "freelancer", label: "Фрилансер", desc: "Работаю один" },
  { value: "small_business", label: "Малый бизнес", desc: "2–10 сотрудников" },
  { value: "medium_business", label: "Средний бизнес", desc: "11–50 сотрудников" },
  { value: "agency", label: "Агентство", desc: "Работа с клиентами" },
];

const goalOptions = [
  "Управление продажами",
  "Ведение клиентской базы",
  "Отслеживание сделок",
  "Email-маркетинг",
  "Поддержка клиентов",
  "Аналитика и отчеты",
];

const industryOptions: { value: UserIndustry; label: string }[] = [
  { value: "real_estate", label: "Недвижимость" },
  { value: "it", label: "IT / Разработка" },
  { value: "marketing", label: "Маркетинг / Реклама" },
  { value: "finance", label: "Финансы / Консалтинг" },
  { value: "education", label: "Образование" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "services", label: "Услуги" },
  { value: "other", label: "Другое" },
];

const backgroundOptions: {
  id: BackgroundPreference;
  name: string;
  gradient: string;
}[] = [
  { id: "aurora", name: "Аврора", gradient: "from-purple-500 via-pink-500 to-blue-500" },
  { id: "ocean", name: "Океан", gradient: "from-cyan-500 to-blue-500" },
  { id: "sunset", name: "Закат", gradient: "from-orange-500 to-pink-500" },
  { id: "forest", name: "Лес", gradient: "from-green-500 to-emerald-500" },
  { id: "minimal", name: "Минимал", gradient: "from-gray-100 to-gray-200" },
  { id: "neon", name: "Неон", gradient: "from-fuchsia-500 to-purple-500" },
];

export function OnboardingWizard() {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState({
    business_type: "" as BusinessType | "",
    goals: [] as string[],
    industry: "" as UserIndustry | "",
    theme: "system" as ThemePreference,
    background: "aurora" as BackgroundPreference,
  });

  const validateStep = (): string | null => {
    if (currentStep === 1 && !formData.business_type) {
      return "Выберите тип профиля";
    }
    if (currentStep === 2 && formData.goals.length === 0) {
      return "Выберите хотя бы одну цель";
    }
    if (currentStep === 3 && !formData.industry) {
      return "Выберите сферу деятельности";
    }
    return null;
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: formData.business_type,
          goals: formData.goals,
          industry: formData.industry,
          theme: formData.theme,
          background: formData.background,
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (response.ok && result.success) {
        toast.success("Добро пожаловать! CRM настроена под вас.");
        setShowConfetti(true);
        return;
      }

      toast.error(result.error || "Не удалось сохранить настройки");
    } catch {
      toast.error("Неожиданная ошибка. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    const stepError = validateStep();
    if (stepError) {
      setError(stepError);
      return;
    }

    setError(null);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      void submitOnboarding();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <LivingBackground type={formData.background} opacity={0.35}>
      {showConfetti && (
        <Confetti
          onComplete={() => {
            window.location.href = "/dashboard";
          }}
        />
      )}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-8">
          <div className="mb-2 flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
                  step.id <= currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.id}
              </div>
            ))}
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-neutral-500">{steps[currentStep - 1]?.title}</p>
        </div>

        <div className="space-y-6">
          {currentStep === 1 && (
            <div>
              <h2 className="mb-2 text-2xl font-bold">Кто вы?</h2>
              <p className="mb-6 text-gray-600">
                Расскажите о себе, чтобы мы настроили CRM под вас
              </p>

              <div className="space-y-3">
                {businessOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${
                      formData.business_type === option.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="business_type"
                      value={option.value}
                      checked={formData.business_type === option.value}
                      onChange={() =>
                        setFormData({ ...formData, business_type: option.value })
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="mb-2 text-2xl font-bold">Для чего будете использовать CRM?</h2>
              <p className="mb-6 text-gray-600">Выберите все подходящие варианты</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {goalOptions.map((goal) => (
                  <label
                    key={goal}
                    className={`flex cursor-pointer items-center rounded-xl border-2 p-3 transition-all ${
                      formData.goals.includes(goal)
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={goal}
                      checked={formData.goals.includes(goal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, goals: [...formData.goals, goal] });
                        } else {
                          setFormData({
                            ...formData,
                            goals: formData.goals.filter((g) => g !== goal),
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="mb-2 text-2xl font-bold">Сфера деятельности</h2>
              <p className="mb-6 text-gray-600">Выберите вашу индустрию</p>

              <div className="space-y-2">
                {industryOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-xl border-2 p-3 transition-all ${
                      formData.industry === option.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="industry"
                      value={option.value}
                      checked={formData.industry === option.value}
                      onChange={() =>
                        setFormData({ ...formData, industry: option.value })
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-3">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="mb-2 text-2xl font-bold">Персонализация</h2>
              <p className="mb-6 text-gray-600">Настройте внешний вид</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Тема оформления</label>
                  <div className="flex gap-3">
                    {(["light", "dark", "system"] as ThemePreference[]).map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme })}
                        className={`flex-1 rounded-lg border-2 px-4 py-2 ${
                          formData.theme === theme
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        {theme === "light"
                          ? "Светлая"
                          : theme === "dark"
                            ? "Тёмная"
                            : "Системная"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Фон</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {backgroundOptions.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, background: bg.id })}
                        className={`rounded-lg border-2 p-3 ${
                          formData.background === bg.id
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : "border-gray-200"
                        }`}
                      >
                        <div className={`mb-2 h-12 rounded bg-gradient-to-br ${bg.gradient}`} />
                        <div className="text-xs font-medium">{bg.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Назад
            </Button>
          )}
          <Button
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Сохранение…"
              : currentStep === steps.length
                ? "Завершить"
                : "Далее"}
          </Button>
        </div>
        </div>
      </div>
    </LivingBackground>
  );
}
