import { describe, expect, it, vi } from "vitest";
import type { MerchantApplicationRecord } from "@/infrastructure/db/repositories/merchant-application-repository";
import type { MerchantDetailRecord } from "@/infrastructure/db/repositories/merchant-repository";
import {
  approveMerchantApplication,
  type ApproveMerchantApplicationDeps,
} from "./merchant-applications";

const CITY_ID = "11111111-1111-4111-8111-111111111111";
const ZONE_ID = "22222222-2222-4222-8222-222222222222";

function pendingApplication(): MerchantApplicationRecord {
  return {
    id: "app-1",
    status: "PENDING",
    businessName: "Panadería Norte",
    contactName: "Ana",
    contactEmail: "ana@example.com",
    contactPhone: "2804123456",
    cityId: CITY_ID,
    zoneId: ZONE_ID,
    cityName: "Rawson",
    zoneName: "Centro",
    description: "Pan artesanal",
    message: "Quiero sumarme",
    merchantId: null,
    reviewedAt: null,
    reviewedByUserId: null,
    rejectionReason: "",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function draftMerchant(): MerchantDetailRecord {
  return {
    id: "merchant-1",
    name: "Panadería Norte",
    slug: "panadera-norte-app1",
    description: "Pan artesanal",
    status: "DRAFT",
    cityId: CITY_ID,
    zoneId: ZONE_ID,
    cityName: "Rawson",
    zoneName: "Centro",
    pickupEnabled: false,
    merchantDeliveryEnabled: false,
    platformDeliveryEnabled: false,
    preparationMinutes: 30,
    acceptingOrders: true,
    pausedUntil: null,
    cityTimezone: "America/Argentina/Buenos_Aires",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function deps(
  overrides: Partial<ApproveMerchantApplicationDeps> = {},
): ApproveMerchantApplicationDeps {
  const tx = { id: "tx-owner-link" };
  return {
    requirePlatformAdmin: vi.fn(async () => ({
      user: { id: "admin-1", email: "admin@example.com" },
      profile: {
        id: "admin-1",
        platformRole: "ADMIN" as const,
        status: "ACTIVE" as const,
        displayName: "Admin",
        phone: null,
      },
    })),
    findMerchantBySlug: vi.fn(async () => null),
    runTransaction: vi.fn(async (fn) => fn(tx as never)),
    findMerchantApplicationById: vi.fn(async () => pendingApplication()),
    insertMerchantDraft: vi.fn(async () => draftMerchant()),
    markApproved: vi.fn(async () => ({
      ...pendingApplication(),
      status: "APPROVED",
      merchantId: "merchant-1",
      reviewedByUserId: "admin-1",
      reviewedAt: new Date("2026-01-02T00:00:00.000Z"),
    })),
    findRegisteredUserByEmail: vi.fn(async () => ({
      id: "user-ana",
      emailConfirmed: true,
    })),
    ensureUserProfile: vi.fn(async () => undefined),
    insertOwnerMembership: vi.fn(async () => undefined),
    isUniqueViolation: () => false,
    ...overrides,
  };
}

const input = { applicationId: "app-1" };

describe("merchant application registered owner linking", () => {
  it("links the confirmed applicant as OWNER during approval", async () => {
    const sharedTx = { id: "shared-tx" };
    const insertOwnerMembership = vi.fn(async (_input, tx) => {
      expect(tx).toBe(sharedTx);
    });
    const current = deps({
      runTransaction: vi.fn(async (fn) => fn(sharedTx as never)),
      insertOwnerMembership,
    });

    const result = await approveMerchantApplication(input, current);

    expect(result.ok).toBe(true);
    expect(current.findRegisteredUserByEmail).toHaveBeenCalledWith(
      "ana@example.com",
    );
    expect(current.ensureUserProfile).toHaveBeenCalledWith({
      userId: "user-ana",
      displayName: "Ana",
    });
    expect(insertOwnerMembership).toHaveBeenCalledWith(
      { merchantId: "merchant-1", userId: "user-ana" },
      sharedTx,
    );
  });

  it("blocks approval when the registered email is not confirmed", async () => {
    const current = deps({
      findRegisteredUserByEmail: vi.fn(async () => ({
        id: "user-ana",
        emailConfirmed: false,
      })),
    });

    const result = await approveMerchantApplication(input, current);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("APPLICANT_EMAIL_UNCONFIRMED");
    }
    expect(current.ensureUserProfile).not.toHaveBeenCalled();
    expect(current.runTransaction).not.toHaveBeenCalled();
    expect(current.insertOwnerMembership).not.toHaveBeenCalled();
  });

  it("blocks approval when the applicant has no registered account", async () => {
    const current = deps({
      findRegisteredUserByEmail: vi.fn(async () => null),
    });

    const result = await approveMerchantApplication(input, current);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("APPLICANT_ACCOUNT_REQUIRED");
    }
    expect(current.runTransaction).not.toHaveBeenCalled();
    expect(current.insertOwnerMembership).not.toHaveBeenCalled();
  });

  it("fails the approval if the atomic OWNER membership write fails", async () => {
    const current = deps({
      insertOwnerMembership: vi.fn(async () => {
        throw new Error("membership write failed");
      }),
    });

    const result = await approveMerchantApplication(input, current);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("OWNER_LINK_FAILED");
    }
    expect(current.markApproved).not.toHaveBeenCalled();
  });
});
