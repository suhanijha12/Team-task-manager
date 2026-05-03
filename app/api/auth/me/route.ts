import { requireUser } from "@/lib/auth";
import { apiOk, handleRouteError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireUser();
    return apiOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
