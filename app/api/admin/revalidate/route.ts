import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

function isAuthorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

/** On-demand cache bust for ISR'd public pages after out-of-band content changes (e.g. a DB import script). */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paths } = (await request.json().catch(() => ({ paths: [] }))) as { paths?: string[] };
  const targets = paths?.length ? paths : ["/blog"];
  for (const path of targets) revalidatePath(path);

  return NextResponse.json({ revalidated: targets });
}
