---
name: tecno-x-web
description: >-
  Maintains the TECNOX Next.js storefront (Norwegian Bokmål UI). Use when editing
  products catalog, mega menu data, cart/checkout flow, or migrating components
  from the legacy TanStack app under ../technox-ui. Ensures next/link, next/image,
  staticSrc for imported assets, and post@tecnox.no branding.
---

# TECNOX web (Next.js)

## Source of truth

- Legacy TanStack Start app: **`technox-ui/`** sibling folder (`src/routes`, `src/components/site`).
- Production Next.js app: **`lovable-nextjs/`** (this repo).

## When porting UI from TanStack

1. Replace `@tanstack/react-router` **`Link`** → **`next/link`**; **`to=`** → **`href=`**.
2. Dynamic product links: **`href={\`/produkter/${slug}\`}`** (not `$slug` route objects).
3. Product images imported from `@/assets`: type **`string | StaticImageData`**; use **`staticSrc()`** for `<img>` or pass **`StaticImageData`** directly to **`next/image`**.
4. Keep Norwegian copy verbatim from the source unless fixing typos.

## Key files

- Products: `src/lib/products.ts`
- Mega menu tree: `src/data/megaMenu.ts`
- Cart: `src/contexts/CartContext.tsx` (`tecnox.cart.v1`)
- Shell: `src/components/site/SiteShell.tsx` — header/footer wrapper for marketing pages
