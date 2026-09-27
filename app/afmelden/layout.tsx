import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Afmelden",
  robots: { index: false, follow: false },
};

export default function OptOutLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-margin-mobile py-xl">
      <div className="w-full max-w-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-lg text-center soft-shadow">
        {children}
      </div>
    </main>
  );
}
