import { describe, expect, it, vi } from "vitest";
import {
  saveMerchantDeliverySettings,
  type DeliverySettingsWriteDeps,
} from "./delivery-settings";

const MERCHANT_ID = "11111111-1111-4111-8111-111111111111";
const CITY_ID = "22222222-2222-4222-8222-222222222222";

function deps(preparationMinutes = 30): DeliverySettingsWriteDeps {
  return {
    requireDeliveryAccess: vi.fn(async () => undefined),
    findMerchant: vi.fn(async () => ({
      id: MERCHANT_ID,
      cityId: CITY_ID,
      cityName: "Rawson",
      pickupEnabled: false,
      preparationMinutes,
      merchantDeliveryEnabled: false,
    })),
    listZonesForCity: vi.fn(async () => []),
    listDeliveryZones: vi.fn(async () => []),
    saveDeliverySettings: vi.fn(async () => []),
  };
}

describe("merchant preparation settings", () => {
  it("persists an explicitly changed preparation time", async () => {
    const current = deps(30);

    const result = await saveMerchantDeliverySettings(
      MERCHANT_ID,
      {
        preparationMinutes: 45,
        merchantDeliveryEnabled: false,
        zones: [],
      },
      current,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.preparationMinutes).toBe(45);
    }
    expect(current.saveDeliverySettings).toHaveBeenCalledWith(MERCHANT_ID, {
      preparationMinutes: 45,
      merchantDeliveryEnabled: false,
      zones: [],
    });
  });

  it("preserves preparation time when a legacy save omits it", async () => {
    const current = deps(35);

    const result = await saveMerchantDeliverySettings(
      MERCHANT_ID,
      {
        merchantDeliveryEnabled: false,
        zones: [],
      },
      current,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.preparationMinutes).toBe(35);
    }
    expect(current.saveDeliverySettings).toHaveBeenCalledWith(MERCHANT_ID, {
      merchantDeliveryEnabled: false,
      zones: [],
    });
  });

  it.each([-1, 1441, 12.5, Number.NaN])(
    "rejects invalid preparation value %s before writing",
    async (preparationMinutes) => {
      const current = deps();

      const result = await saveMerchantDeliverySettings(
        MERCHANT_ID,
        {
          preparationMinutes,
          merchantDeliveryEnabled: false,
          zones: [],
        },
        current,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_PREPARATION");
      }
      expect(current.saveDeliverySettings).not.toHaveBeenCalled();
    },
  );
});
