"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface Step {
  title: string;
  description: string;
  time: string;
  icon: string;
  href: string;
  cta: string;
  done: boolean;
}

interface OnboardingWizardProps {
  steps: Step[];
  salonId: string;
}

export function OnboardingWizard({ steps, salonId }: OnboardingWizardProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Show only on first visit; track per salon in localStorage
  useEffect(() => {
    const key = `ka_wizard_${salonId}`;
    const allDone = steps.every((s) => s.done);
    if (!allDone && !localStorage.getItem(key)) {
      setOpen(true);
    }
  }, [salonId, steps]);

  function dismiss() {
    localStorage.setItem(`ka_wizard_${salonId}`, "1");
    setOpen(false);
  }

  if (!open) return null;

  const completedCount = steps.filter((s) => s.done).length;
  const step = steps[currentStep]!;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-margin-mobile py-xl">
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-lg py-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Stel je assistent in
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              {completedCount} van {steps.length} stappen voltooid
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Sluiten"
            className="rounded-full p-xs text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-surface-container-highest">
          <div
            className="h-1 bg-primary transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="px-lg py-lg">
          {/* Step tabs */}
          <div className="mb-lg flex gap-xs">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-label-sm font-label-sm transition-colors ${
                  i === currentStep
                    ? "bg-primary text-on-primary"
                    : s.done
                      ? "bg-primary/20 text-primary"
                      : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {s.done ? <Icon name="check" className="text-[16px]" /> : i + 1}
              </button>
            ))}
          </div>

          {/* Current step */}
          <div className="flex items-start gap-md mb-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
              <Icon name={step.icon} className="text-[24px]" />
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">
                {step.title}
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {step.description}
              </p>
              <p className="mt-xs text-label-sm text-on-surface-variant flex items-center gap-xs">
                <Icon name="schedule" className="text-[14px]" />
                Ongeveer {step.time}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-sm">
            <Link
              href={step.href}
              onClick={dismiss}
              className="flex-1 inline-flex items-center justify-center gap-sm rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 soft-shadow"
            >
              {step.done ? <Icon name="check_circle" filled className="text-[18px]" /> : <Icon name="arrow_forward" className="text-[18px]" />}
              {step.cta}
            </Link>
            {!isLast && (
              <button
                onClick={() => setCurrentStep((i) => Math.min(i + 1, steps.length - 1))}
                className="rounded-full border border-outline-variant px-md py-sm text-label-md text-on-surface-variant hover:bg-surface-container"
              >
                Volgende →
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant/40 px-lg py-sm">
          <button
            onClick={dismiss}
            className="text-label-sm text-on-surface-variant hover:text-on-surface"
          >
            Wizard sluiten — later via Overzicht terug te vinden
          </button>
        </div>
      </div>
    </div>
  );
}
