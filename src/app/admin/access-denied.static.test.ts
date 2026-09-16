import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const loadAdminSource = readFileSync(
  new URL("./_lib/load-admin.ts", import.meta.url),
  "utf8",
);
const accessDeniedSource = readFileSync(
  new URL("../acceso-denegado/page.tsx", import.meta.url),
  "utf8",
);

describe("admin access denied routing", () => {
  it("sends unauthenticated visitors to login", () => {
    expect(loadAdminSource).toContain(
      'error.code === "UNAUTHENTICATED" || error.code === "CONFIG_MISSING"',
    );
    expect(loadAdminSource).toContain(
      "redirect(\`/login?next=\${encodeURIComponent(nextPath)}\`)",
    );
  });

  it("keeps authenticated forbidden users out of the login flow", () => {
    expect(loadAdminSource).toContain('redirect("/acceso-denegado")');
    expect(loadAdminSource).not.toContain("&error=forbidden");
  });

  it("offers forbidden users a clear explanation and safe destinations", () => {
    expect(accessDeniedSource).toContain("No tenés acceso a esta sección");
    expect(accessDeniedSource).toContain("Tu sesión sigue activa");
    expect(accessDeniedSource).toContain('href="/"');
    expect(accessDeniedSource).toContain('href="/cuenta"');
  });
});
