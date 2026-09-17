import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("merchant owner linking hardening", () => {
  it("fails closed when Auth Admin lookup cannot be performed", () => {
    const wiring = read(
      "src/application/merchant/merchant-application-wiring.ts",
    );

    expect(wiring).toContain("if (!hasSupabaseSecretKey())");
    expect(wiring).toContain(
      "SUPABASE_SECRET_KEY is required to verify the merchant applicant before approval",
    );
    expect(wiring).not.toMatch(/catch\s*\{\s*return null;?\s*\}/);
  });

  it("keeps operational onboarding out of the admin merchant detail", () => {
    const detail = read("src/app/admin/merchants/[merchantId]/page.tsx");

    expect(detail).toContain("Gestión a cargo del propietario");
    expect(detail).toContain(
      "Medios de pago, catálogo, retiro, delivery y publicación se",
    );
    expect(detail).not.toContain("ActivateMerchantForm");
    expect(detail).not.toContain("InviteOwnerForm");
    expect(detail).not.toContain("findMerchantActivationReadiness");
    expect(detail).not.toContain("Preparación para operar");
    expect(detail).not.toContain("Activar comercio");
  });
});
