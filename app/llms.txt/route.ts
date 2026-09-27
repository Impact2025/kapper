import { buildLlmsTxt, llmsResponse } from "@/lib/seo/llms";
import { KAPPER_VERTICAL } from "@/lib/verticals";

export const revalidate = 3600;

export async function GET() {
  return llmsResponse(await buildLlmsTxt(KAPPER_VERTICAL));
}
