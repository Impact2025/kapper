import type { Metadata } from "next";
import { Card } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Account wordt ingericht" };

export default function SetupPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-md py-xl text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
        <Icon name="pending" className="text-[32px] text-on-primary-fixed" />
      </div>
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
          Je account wordt ingericht
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Ons team koppelt je salon aan je account. Je ontvangt een e-mail zodra alles klaar staat.
          Gemiddelde doorlooptijd: één werkdag.
        </p>
      </div>

      <div className="w-full">
        <Card>
          <div className="flex items-start gap-sm text-left">
            <Icon name="support_agent" className="mt-0.5 shrink-0 text-[22px] text-primary" />
            <div>
              <div className="mb-xs text-body-md font-medium text-on-surface">Vragen?</div>
              <p className="text-label-sm text-on-surface-variant">
                Mail naar{" "}
                <a
                  href="mailto:support@kappersassistent.nl"
                  className="text-primary hover:underline"
                >
                  support@kappersassistent.nl
                </a>{" "}
                — we reageren binnen één werkdag.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
