/**
 * Compare admin category order vs storefront dedupe order.
 * Usage: node scripts/verify-mega-order.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function sortNavCollections(items) {
  return [...items]
    .map((row) => ({
      ...row,
      children: row.children?.length ? sortNavCollections(row.children) : row.children ?? [],
    }))
    .sort((a, b) => {
      const byPos = Number(a.position) - Number(b.position);
      if (byPos !== 0) return byPos;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

function pickDisplayNavRoot(rows) {
  return rows.reduce((best, row) => {
    const bestId = Number.parseInt(String(best.id), 10);
    const rowId = Number.parseInt(String(row.id), 10);
    if (Number.isFinite(bestId) && Number.isFinite(rowId) && rowId !== bestId) {
      return rowId > bestId ? row : best;
    }
    return best;
  });
}

function pickAdminCanonicalRoot(rows) {
  return rows.reduce((best, row) => {
    const bestId = Number.parseInt(String(best.id), 10);
    const rowId = Number.parseInt(String(row.id), 10);
    if (Number.isFinite(bestId) && Number.isFinite(rowId) && rowId !== bestId) {
      return rowId < bestId ? row : best;
    }
    return best;
  });
}

function dedupeNavRootsBySlug(roots) {
  const twinsBySlug = new Map();
  for (const row of roots) {
    const twins = twinsBySlug.get(row.slug);
    if (twins) twins.push(row);
    else twinsBySlug.set(row.slug, [row]);
  }

  const sortRows = [...twinsBySlug.values()].map((twins) => {
    const admin = pickAdminCanonicalRoot(twins);
    return {
      display: pickDisplayNavRoot(twins),
      admin,
      sortPos: Number(admin.position),
      sortName: admin.name,
    };
  });

  sortRows.sort((a, b) => {
    const byPos = a.sortPos - b.sortPos;
    if (byPos !== 0) return byPos;
    return a.sortName.localeCompare(b.sortName, undefined, { sensitivity: "base" });
  });

  return sortRows;
}

const env = loadEnv();
const url = env.VENDURE_SHOP_API_URL || env.NEXT_PUBLIC_VENDURE_SHOP_API_URL;
const token = env.VENDURE_CHANNEL_TOKEN;

if (!url || !token) {
  console.error("Missing VENDURE_SHOP_API_URL or VENDURE_CHANNEL_TOKEN in .env.local");
  process.exit(1);
}

const query = /* GraphQL */ `
  query {
    collections(options: { topLevelOnly: true, take: 100, sort: { position: ASC } }) {
      items {
        id
        name
        slug
        position
      }
      totalItems
    }
  }
`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "vendure-token": token,
    "vendure-language-code": "en",
  },
  body: JSON.stringify({ query }),
});

const json = await res.json();
const items = json?.data?.collections?.items ?? [];

console.log(`\nAdmin panel order (all ${items.length} top-level rows, position ASC + name):`);
for (const [i, r] of sortNavCollections(items).entries()) {
  console.log(`${String(i + 1).padStart(2)}. pos=${r.position} id=${r.id} slug=${r.slug} name=${r.name}`);
}

const deduped = dedupeNavRootsBySlug(items);
console.log(`\nStorefront order (${deduped.length} unique slugs — admin position, NB display name):`);
for (const [i, row] of deduped.entries()) {
  const { display, admin } = row;
  console.log(
    `${String(i + 1).padStart(2)}. adminPos=${admin.position} adminName=${admin.name} → display=${display.name} (${display.slug})`,
  );
}
