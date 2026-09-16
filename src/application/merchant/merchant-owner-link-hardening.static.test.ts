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

  it("does not offer another owner invite after an OWNER is already linked", () => {
    const detail = read("src/app/admin/merchants/[merchantId]/page.tsx");

    expect(detail).toContain("{hasOwner ? (");
    expect(detail).toContain("Propietario vinculado");
    expect(detail).toContain(
      "El comercio ya tiene una cuenta propietaria activa. No hace",
    );
    expect(detail).toContain(
      "falta enviar una invitación para completar el onboarding.",
    );
    expect(detail).not.toContain("Invitar otro propietario");
    expect(detail).toContain("<InviteOwnerForm merchantId={merchant.id} />");
  });
});
