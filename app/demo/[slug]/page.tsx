import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicDemoSalon } from "@/lib/salon/public-demo";
import { DemoChat } from "@/components/demo/demo-chat";

export const metadata: Metadata = {
  title: "Live demo",
  robots: { index: false, follow: false },
};

export default async function PublicDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = await getPublicDemoSalon(slug);
  if (!salon) notFound();

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <DemoChat slug={slug} salonName={salon.name} salonCity={salon.city} />
    </div>
  );
}
