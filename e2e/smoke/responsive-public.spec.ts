import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import {
  attachPageCrashGuard,
  expectNoNextCrashOverlay,
} from "../lib/no-page-crash";
import { E2E_PHONE_VIEWPORTS } from "../lib/viewports";

async function expectNoHorizontalPageOverflow(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(
    dimensions.documentWidth,
    `document overflowed ${dimensions.documentWidth - dimensions.viewportWidth}px horizontally`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(
    dimensions.bodyWidth,
    `body overflowed ${dimensions.bodyWidth - dimensions.viewportWidth}px horizontally`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function expectPublicRouteUsable(page: Page, path: string) {
  switch (path) {
    case "/":
      await expect(
        page.getByRole("heading", { name: /Todo lo de tu zona/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Ver comercios" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Carrito" })).toBeVisible();
      return;
    case "/login":
      await expect(
        page.getByRole("heading", { name: "Ingresá a Bag It" }),
      ).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Contraseña")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Ingresar" }),
      ).toBeVisible();
      return;
    case "/forgot-password":
      await expect(
        page.getByRole("heading", { name: "Recuperá tu contraseña" }),
      ).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Enviar enlace" }),
      ).toBeVisible();
      return;
    case "/carrito":
      await expect(
        page.getByRole("heading", { name: "Tu carrito está vacío" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Ver comercios" }),
      ).toBeVisible();
      return;
    default:
      throw new Error(`Responsive smoke route not configured: ${path}`);
  }
}

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/carrito"] as const;

test.describe("pre-pilot responsive public QA (READ_ONLY)", () => {
  for (const [viewportName, viewport] of Object.entries(E2E_PHONE_VIEWPORTS)) {
    for (const path of PUBLIC_ROUTES) {
      test(`${path} stays usable without page overflow at ${viewportName} ${viewport.width}x${viewport.height}`, async ({
        page,
      }) => {
        const { errors } = attachPageCrashGuard(page);
        await page.setViewportSize(viewport);
        await page.goto(path, { waitUntil: "domcontentloaded" });

        await expectPublicRouteUsable(page, path);
        await expectNoHorizontalPageOverflow(page);
        await expectNoNextCrashOverlay(page);
        expect(errors).toEqual([]);
      });
    }
  }
});
