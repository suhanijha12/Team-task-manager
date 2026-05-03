import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiCreated, handleRouteError } from "@/lib/errors";
import { setAuthCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validators";
import { toPublicUser } from "@/lib/serializers";

export async function POST(request: Request) {
  try {
    const input = signupSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash
      }
    });

    await setAuthCookie({ userId: user.id, email: user.email });

    return apiCreated({ user: toPublicUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}
