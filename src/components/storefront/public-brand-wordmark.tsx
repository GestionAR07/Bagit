import { APP_NAME } from "@/lib/app-info";
import { PublicBrandMark } from "@/components/storefront/public-brand-mark";

type Size = "header" | "hero" | "compact";
type MarkSize = "header" | "hero" | "compact";
type Layout = "lockup" | "full" | "logotype";
type Tone = "plain" | "gradient";
type Surface = "light" | "dark";

type Props = {
  size?: Size;
  layout?: Layout;
  tone?: Tone;
  surface?: Surface;
  showMark?: boolean;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const lockupMarkSize: Record<Size, MarkSize> = {
  header: "header",
  hero: "hero",
  compact: "compact",
};

const textSize: Record<Size, string> = {
  header: "text-[1.55rem] sm:text-[1.8rem]",
  hero: "text-4xl sm:text-5xl",
  compact: "text-xl",
};

function resolveLayout(
  layout: Layout | undefined,
  size: Size,
  showMark: boolean,
): Layout {
  if (layout) {
    return layout;
  }
  if (size === "hero") {
    return "full";
  }
  return showMark ? "lockup" : "logotype";
}

function BrandName({ size }: { size: Size }) {
  return (
    <span
      aria-label={APP_NAME}
      className={cx(
        "font-display inline-flex translate-y-[1px] items-baseline leading-none font-extrabold tracking-[-0.045em]",
        textSize[size],
      )}
    >
      <span aria-hidden className="text-[#0b78b5]">
        B
      </span>
      <span aria-hidden className="text-[var(--ps-sky)]">
        a
      </span>
      <span aria-hidden className="text-[var(--ps-sky-medium)]">
        g
      </span>
      <span aria-hidden className="text-[var(--ps-yellow)]">
        it
      </span>
    </span>
  );
}

/**
 * Bagit visual wordmark preview for the formal Bag It brand. Keeps the existing shopping-bag symbol while the
 * final mascot and vector lettering are evaluated.
 */
export function PublicBrandWordmark({
  size = "header",
  layout,
  surface,
  showMark = true,
  className,
}: Props) {
  const resolvedSurface = surface ?? (size === "hero" ? "dark" : "light");
  const resolvedLayout = resolveLayout(layout, size, showMark);

  if (resolvedLayout === "full") {
    return (
      <span
        className={cx(
          "brand-wordmark inline-flex flex-col items-center gap-1.5",
          className,
        )}
      >
        <PublicBrandMark size={lockupMarkSize[size]} surface={resolvedSurface} />
        <BrandName size={size} />
      </span>
    );
  }

  if (resolvedLayout === "logotype") {
    return (
      <span
        className={cx("brand-wordmark inline-flex items-center", className)}
      >
        <BrandName size={size} />
      </span>
    );
  }

  return (
    <span
      className={cx(
        "brand-wordmark brand-wordmark--lockup inline-flex items-center gap-2",
        className,
      )}
    >
      <PublicBrandMark size={lockupMarkSize[size]} surface={resolvedSurface} />
      <BrandName size={size} />
    </span>
  );
}
