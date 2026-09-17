import { describe, expect, it, vi } from "vitest";
import { AuthzError } from "@/server/auth/errors";
import type { MerchantActivationReadiness } from "./activate-merchant";
import { publishMerchant, type PublishMerchantDeps } from "./publish-merchant";

const readyMerchant: MerchantActivationReadiness = {
  merchantId: "merchant-1",
  status: "DRAFT",
  pickupEnabled: true,
  merchantDeliveryEnabled: false,
  activeOwnerCount: 1,
  activeDeliveryZoneCount: 0,
  activePaymentMethodCount: 1,
  activeCatalogProductCount: 1,
};

function baseDeps(
  overrides: Partial<PublishMerchantDeps> = {},
): PublishMerchantDeps {
  return {
    requireMerchantOwner: vi.fn(async () => undefined),
    findActivationReadiness: vi.fn(async () => readyMerchant),
    activateDraftMerchant: vi.fn(async () => ({
      id: "merchant-1",
      status: "ACTIVE",
    })),
    ...overrides,
  };
}

describe("owner merchant publication", () => {
  it("requires OWNER authorization for the merchant", async () => {
    const deps = baseDeps({
      requireMerchantOwner: vi.fn(async () => {
        throw new AuthzError("MERCHANT_ROLE_FORBIDDEN", "forbidden");
      }),
    });

    await expect(publishMerchant("merchant-1", deps)).rejects.toMatchObject({
      code: "MERCHANT_ROLE_FORBIDDEN",
    });
    expect(deps.findActivationReadiness).not.toHaveBeenCalled();
    expect(deps.activateDraftMerchant).not.toHaveBeenCalled();
  });

  it("publishes a ready DRAFT merchant", async () => {
    const deps = baseDeps();
    const result = await publishMerchant("merchant-1", deps);

    expect(result).toEqual({
      ok: true,
      value: {
        merchantId: "merchant-1",
        status: "ACTIVE",
        alreadyActive: false,
      },
    });
    expect(deps.requireMerchantOwner).toHaveBeenCalledWith("merchant-1");
    expect(deps.activateDraftMerchant).toHaveBeenCalledWith("merchant-1");
  });

  it("blocks publication while owner setup requirements are incomplete", async () => {
    const deps = baseDeps({
      findActivationReadiness: vi.fn(async () => ({
        ...readyMerchant,
        pickupEnabled: false,
        activePaymentMethodCount: 0,
        activeCatalogProductCount: 0,
      })),
    });

    const result = await publishMerchant("merchant-1", deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("MERCHANT_NOT_READY");
      expect(result.error.blockers).toEqual([
        "FULFILLMENT_REQUIRED",
        "PAYMENT_METHOD_REQUIRED",
        "CATALOG_PRODUCT_REQUIRED",
      ]);
    }
    expect(deps.activateDraftMerchant).not.toHaveBeenCalled();
  });

  it("requires an active delivery zone when own delivery is enabled", async () => {
    const deps = baseDeps({
      findActivationReadiness: vi.fn(async () => ({
        ...readyMerchant,
        pickupEnabled: false,
        merchantDeliveryEnabled: true,
        activeDeliveryZoneCount: 0,
      })),
    });

    const result = await publishMerchant("merchant-1", deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.blockers).toContain("DELIVERY_ZONE_REQUIRED");
    }
    expect(deps.activateDraftMerchant).not.toHaveBeenCalled();
  });

  it("is idempotent after the owner has already published", async () => {
    const deps = baseDeps({
      findActivationReadiness: vi.fn(async () => ({
        ...readyMerchant,
        status: "ACTIVE",
      })),
    });

    const result = await publishMerchant("merchant-1", deps);

    expect(result).toEqual({
      ok: true,
      value: {
        merchantId: "merchant-1",
        status: "ACTIVE",
        alreadyActive: true,
      },
    });
    expect(deps.activateDraftMerchant).not.toHaveBeenCalled();
  });
});
