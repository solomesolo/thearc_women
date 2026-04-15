/**
 * Sensitive document access utilities
 *
 * Two responsibilities:
 *   1. checkAndAudit() — resolve the sensitivity profile for a document and
 *      write an audit log entry when the level is sensitive or above.
 *      Call this at the start of any GET route that returns extracted content.
 *
 *   2. getAuditLog() — return paginated access log for a document (owner only).
 */
import { getPrisma } from "@/lib/db";

// Levels ordered for comparison
const LEVEL_ORDER: Record<string, number> = {
  standard:         0,
  sensitive:        1,
  high_sensitivity: 2,
};

export type SensitivityLevel = "standard" | "sensitive" | "high_sensitivity";

export interface SensitivityInfo {
  sensitivityLevel:  SensitivityLevel;
  privacyTags:       string[];
  flaggedBins:       string[];
}

/**
 * Resolve the sensitivity profile of a document.
 * If the document is sensitive or high_sensitivity, write an audit log entry.
 *
 * Returns null when the sensitivity profile doesn't exist yet (OCR still running).
 *
 * @param documentId  UUID of the document
 * @param userEmail   Authenticated user performing the request
 * @param route       Request path, e.g. "/api/ocr/{id}/extract"
 * @param action      "read" | "export" | "re_run"  (default "read")
 */
export async function checkAndAudit(
  documentId:  string,
  userEmail:   string,
  route:       string,
  action:      "read" | "export" | "re_run" = "read"
): Promise<SensitivityInfo | null> {
  const prisma = getPrisma();

  const profile = await prisma.sensitivityProfile.findUnique({
    where: { documentId },
    select: {
      sensitivityLevel: true,
      privacyTags:      true,
      flaggedBins:      true,
    },
  });

  if (!profile) return null;

  const level = profile.sensitivityLevel as SensitivityLevel;

  // Log access for sensitive and above
  if (LEVEL_ORDER[level] >= LEVEL_ORDER["sensitive"]) {
    // Fire-and-forget — never block the response on audit write
    prisma.documentAccessLog
      .create({
        data: {
          documentId,
          userEmail,
          route,
          action,
          sensitivityLevel: level,
        },
      })
      .catch((err) => {
        console.error("[audit] Failed to write access log:", err);
      });
  }

  return {
    sensitivityLevel: level,
    privacyTags:      profile.privacyTags,
    flaggedBins:      profile.flaggedBins,
  };
}

/**
 * Return whether a sensitivity level is at or above the given threshold.
 */
export function isAtLeast(
  level: SensitivityLevel | string,
  threshold: SensitivityLevel
): boolean {
  return (LEVEL_ORDER[level] ?? 0) >= LEVEL_ORDER[threshold];
}

export interface AuditLogEntry {
  id:              number;
  userEmail:       string;
  route:           string;
  action:          string;
  sensitivityLevel: string;
  accessedAt:      string;
}

/**
 * Return the audit log for a document.
 * Caller must have already verified that userEmail owns the document.
 *
 * @param documentId   UUID of the document
 * @param limit        Max entries to return (default 100)
 * @param beforeId     Cursor for pagination — return entries with id < beforeId
 */
export async function getAuditLog(
  documentId: string,
  limit = 100,
  beforeId?: number
): Promise<AuditLogEntry[]> {
  const prisma = getPrisma();

  const rows = await prisma.documentAccessLog.findMany({
    where: {
      documentId,
      ...(beforeId != null ? { id: { lt: beforeId } } : {}),
    },
    orderBy: { accessedAt: "desc" },
    take: limit,
    select: {
      id:              true,
      userEmail:       true,
      route:           true,
      action:          true,
      sensitivityLevel: true,
      accessedAt:      true,
    },
  });

  return rows.map((r) => ({
    id:              r.id,
    userEmail:       r.userEmail,
    route:           r.route,
    action:          r.action,
    sensitivityLevel: r.sensitivityLevel,
    accessedAt:      r.accessedAt.toISOString(),
  }));
}
