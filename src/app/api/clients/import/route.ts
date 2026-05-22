import { NextRequest } from "next/server";
import { jsonError, jsonOk, withWriteSession } from "@/lib/api/helpers";
import { importClientsFromCsv } from "@/services/clients";

export async function POST(request: NextRequest) {
  return withWriteSession(request, async (session) => {
    const contentType = request.headers.get("content-type") ?? "";

    let csv = "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (file instanceof File) {
        csv = await file.text();
      } else {
        csv = String(form.get("csv") ?? "");
      }
    } else {
      try {
        const body = (await request.json()) as { csv?: string };
        csv = body.csv ?? "";
      } catch {
        csv = await request.text();
      }
    }

    if (!csv.trim()) {
      return jsonError("csv content required", 400);
    }

    const result = await importClientsFromCsv(session, csv);
    return jsonOk(result, 201);
  });
}
