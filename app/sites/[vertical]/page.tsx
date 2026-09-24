import { notFound } from "next/navigation";
import { JobLanding } from "@/components/marketing/job-landing";
import { getVerticalConfig } from "@/lib/verticals";

export default async function VerticalHomePage({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const pack = getVerticalConfig(vertical);
  if (!pack.marketing.landing) notFound();
  return <JobLanding pack={pack} />;
}
