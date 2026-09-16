import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("owner-controlled merchant onboarding", () => {
  it("authorizes publication with OWNER role instead of platform admin", () => {
    const wiring = read(
      "src/application/merchant/merchant-publication-wiring.ts",
    );
    const publication = read("src/application/merchant/publish-merchant.ts");

    expect(wiring).toContain('requireMerchantRole(merchantId, ["OWNER"])');
    expect(wiring).not.toContain("requirePlatformAdmin");
    expect(publication).toContain("getMerchantActivationBlockers");
    expect(publication).toContain("activateDraftMerchant");
  });

  it("puts readiness and publication controls in the merchant workspace", () => {
    const page = read("src/app/merchant/[merchantId]/page.tsx");
    const panel = read(
      "src/app/merchant/[merchantId]/merchant-publication-panel.tsx",
    );

    expect(page).toContain("findMerchantActivationReadiness");
    expect(page).toContain("MerchantPublicationPanel");
    expect(panel).toContain("Publicar comercio");
    expect(panel).toContain("Prepará tu comercio");
    expect(panel).toContain("sin intervención del administrador");
  });

  it("keeps approval limited to applicationId", () => {
    const useCase = read("src/application/merchant/merchant-applications.ts");
    const actions = read("src/app/admin/merchant-applications/actions.ts");

    expect(useCase).toContain(
      "export type ApproveMerchantApplicationInput = {\n  applicationId: string;\n};",
    );
    expect(actions).not.toContain('formData.get("slug")');
    expect(actions).not.toContain('formData.get("pickupEnabled")');
    expect(actions).not.toContain('formData.get("merchantDeliveryEnabled")');
    expect(actions).not.toContain('formData.get("preparationMinutes")');
  });
});
