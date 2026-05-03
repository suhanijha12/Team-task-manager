import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details: unknown[] = []
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function apiCreated<T>(data: T) {
  return apiOk(data, { status: 201 });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request input.",
          details: error.issues
        }
      },
      { status: 400 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with the provided unique value already exists.",
          details: []
        }
      },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        details: []
      }
    },
    { status: 500 }
  );
}

export function notFound(message = "Resource not found.") {
  return new AppError(404, "NOT_FOUND", message);
}

export function forbidden(message = "You do not have permission to do that.") {
  return new AppError(403, "FORBIDDEN", message);
}

export function unauthenticated(message = "Authentication is required.") {
  return new AppError(401, "UNAUTHENTICATED", message);
}
