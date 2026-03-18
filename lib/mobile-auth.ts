import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production-abc123xyz"
);

const ISSUER = "eis-command-center";
const AUDIENCE = "eis-mobile";

export interface MobileTokenPayload {
  userId: string;
  username: string;
  role: string;
}

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Extract and verify Bearer token from request headers.
 * Returns the authenticated user's id, or null if invalid.
 */
export async function authenticateMobileRequest(
  request: Request
): Promise<{ userId: string; role: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = await verifyMobileToken(token);
  if (!payload) return null;

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return { userId: user.id, role: user.role };
}
