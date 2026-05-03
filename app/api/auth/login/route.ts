import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError, apiOk, handleRouteError } from "@/lib/errors";
import { setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { toPublicUser } from "@/lib/serializers";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "UNAUTHENTICATED", "Invalid email or password.");
    }

    await setAuthCookie({ userId: user.id, email: user.email });

    return apiOk({ user: toPublicUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}
