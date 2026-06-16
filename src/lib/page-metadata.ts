import type { Metadata } from "next";
import { getServerLocale } from "@/lib/locale.server";
import { BRAND_NAME } from "@/lib/brand";
import { tr, type Locale } from "@/lib/locale";

export type LocalizedPageCopy = {
  titleNb: string;
  titleEn: string;
  descNb: string;
  descEn: string;
  ogTitleNb?: string;
  ogTitleEn?: string;
  ogDescNb?: string;
  ogDescEn?: string;
};

export function buildPageMetadata(locale: Locale, copy: LocalizedPageCopy): Metadata {
  const title = tr(locale, copy.titleNb, copy.titleEn);
  const description = tr(locale, copy.descNb, copy.descEn);
  const ogTitle = tr(locale, copy.ogTitleNb ?? copy.titleNb, copy.ogTitleEn ?? copy.titleEn);
  const ogDesc = tr(locale, copy.ogDescNb ?? copy.descNb, copy.ogDescEn ?? copy.descEn);

  return {
    title,
    description,
    openGraph: {
      title: `${ogTitle} — ${BRAND_NAME}`,
      description: ogDesc,
    },
  };
}

export async function localizedPageMetadata(copy: LocalizedPageCopy): Promise<Metadata> {
  const locale = await getServerLocale();
  return buildPageMetadata(locale, copy);
}
