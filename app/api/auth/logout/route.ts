import { apiOk, handleRouteError } from "@/lib/errors";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return apiOk({ loggedOut: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
