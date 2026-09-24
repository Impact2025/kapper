"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Opens the floating support chat (listens in components/support/chat-widget.tsx). */
export function OpenChatButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("support-chat:open"))}
      className={cn(
        "inline-flex items-center justify-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow",
        className,
      )}
    >
      <Icon name="smart_toy" className="text-[20px]" />
      {children ?? "Vraag het de AI-assistent"}
    </button>
  );
}
