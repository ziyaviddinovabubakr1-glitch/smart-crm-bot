import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withWriteSession } from "@/lib/api/helpers";
import { analyzeCommunicationById } from "@/services/interactions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const body = await parseJsonBody<{ reanalyze?: boolean }>(request).catch(() => ({}));

    const communication = await analyzeCommunicationById(session, id);
    if (!communication) return jsonError("Not found", 404);

    return jsonOk({
      communication,
      reanalyzed: body.reanalyze ?? true,
    });
  });
}
