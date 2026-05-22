import { NextRequest } from "next/server";
import { jsonOk, withSession } from "@/lib/api/helpers";
import { getUserById } from "@/services/users";
import { toPublicUser } from "@/services/auth";

export async function GET(request: NextRequest) {
  return withSession(request, async (session) => {
    const user = await getUserById(session.id);
    if (!user) {
      return jsonOk({ user: session });
    }
    return jsonOk({ user: toPublicUser(user) });
  });
}
