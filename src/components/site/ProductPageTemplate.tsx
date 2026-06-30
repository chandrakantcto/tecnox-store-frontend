"use client";

/**
 * Single-product layout: gallery & variant-aware buy box, highlights, specs, reviews, quote, related.
 */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/site/TopBar";
import { MainNav } from "@/components/site/MainNav";
import { Footer } from "@/components/site/Footer";
import { megaMenuToFooterRoots } from "@/lib/vendure/catalog-data";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { ImageUnavailablePlaceholder } from "@/components/site/ImageUnavailablePlaceholder";
import { StorefrontRemoteImage } from "@/components/site/StorefrontRemoteImage";
import { useStorefrontPrice } from "@/hooks/use-storefront-price";
import {
  cartSnapshotFromProduct,
  productLocalizedCategory,
  productLocalizedDescriptionHtml,
  productLocalizedName,
  productLocalizedPlainDescription,
  type LocalizedBulletBundle,
  type Product,
  type StorefrontVariantDetail,
} from "@/lib/catalog/storefront-product";
import type { MegaMenuLocales, SidebarTreeNode } from "@/lib/vendure/catalog-types";
import { displayBrandName } from "@/lib/brand";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { isMissingStorefrontImageSource } from "@/lib/storefront-image";
import { useCart } from "@/contexts/CartContext";
import { Check, ChevronDown, ChevronRight, Home, Minus, Plus, ShoppingBag, Star, ShieldCheck, Truck, Wrench, FileText, Printer, FileDown } from "lucide-react";

export type ProductPageTemplateProps = {
  product: Product;
  relatedProducts?: Product[];
  locale: Locale;
  megaMenuByLocale?: MegaMenuLocales;
  sidebarTree?: SidebarTreeNode[];
};

export function ProductPageTemplate({
  product,
  relatedProducts = [],
  locale,
  megaMenuByLocale,
  sidebarTree = [],
}: ProductPageTemplateProps) {
  const router = useRouter();
  const { addItemFromSnapshot, syncing, lastActionError, clearLastActionError, setSidebarOpen } = useCart();
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const [selectedVid, setSelectedVid] = useState(() => {
    const v = product.hydratedVariantId ?? product.defaultVariantId ?? variants[0]?.id ?? "";
    return v;
  });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("description");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [pdfMounted, setPdfMounted] = useState(false);

  useEffect(() => {
    setPdfMounted(true);
  }, []);

  const effectiveVariant = useMemo((): StorefrontVariantDetail | null => {
    if (!variants.length) return null;
    return variants.find((v) => v.id === selectedVid) ?? variants[0] ?? null;
  }, [variants, selectedVid]);

  useEffect(() => {
    const defaultVariantId = product.variants?.[0]?.id;
    const v =
      product.hydratedVariantId ??
      product.defaultVariantId ??
      defaultVariantId ??
      "";
    if (v) setSelectedVid(v);
  }, [product.slug, product.hydratedVariantId, product.defaultVariantId, product.variants]);


  const toggleCategory = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const renderSidebarTree = (nodes: SidebarTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedCategories.includes(node.id);
      const isSubActive = false;

      if (depth === 0) {
        return (
          <div key={node.id} className="group border-b border-gray-50 last:border-0">
            <div className="flex items-center justify-between hover:bg-[#f8f8f8] transition-colors">
              <Link
                href={`/produkter?cat=${encodeURIComponent(node.slug)}`}
                className="flex-1 block px-4 py-3"
              >
                <span className="text-[13px] font-medium min-w-0 truncate text-[var(--color-ink)]">
                  {locale === "en" ? node.nameEn || node.name : node.nameNb || node.name}
                  <span className="ml-2 tabular-nums text-[11px] text-[var(--color-muted)] font-normal">
                    ({node.count})
                  </span>
                </span>
              </Link>
              {node.children && node.children.length > 0 && (
                <div
                  className="p-3 cursor-pointer"
                  onClick={(e) => toggleCategory(e, node.id)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform text-[var(--color-muted)] ${!isExpanded ? "-rotate-90" : ""}`}
                    strokeWidth={2}
                  />
                </div>
              )}
            </div>
            {isExpanded && node.children && node.children.length > 0 && (
              <div className="bg-[#fbfbfb] py-1">
                {renderSidebarTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }
      return (
        <div key={node.id}>
          <Link
            href={`/produkter?cat=${encodeURIComponent(node.slug)}`}
            className={`flex items-center gap-3 py-2 text-[12px] font-medium transition-colors ${isSubActive ? "text-[var(--color-copper)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
            style={{ paddingLeft: `${16 + depth * 16}px`, paddingRight: '16px' }}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSubActive ? "bg-[var(--color-copper)]" : "bg-[var(--color-divider)]"}`} />
            <span className="flex-1 truncate">
              {locale === "en" ? node.nameEn || node.name : node.nameNb || node.name}
            </span>
          </Link>
          {isExpanded && node.children && node.children.length > 0 && (
            <div className="bg-white/10 border-l border-[var(--color-divider)] ml-4">
              {renderSidebarTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const gallery = useMemo(() => product.galleryImageUrls?.length ? product.galleryImageUrls : [product.img], [product.galleryImageUrls, product.img]);

  useEffect(() => {
    if (!effectiveVariant?.imageSrc?.trim()) return;
    const idx = gallery.findIndex((u) => u === effectiveVariant.imageSrc);
    if (idx >= 0) setActiveImg(idx);
  }, [effectiveVariant?.id, effectiveVariant?.imageSrc, gallery]);

  const mainImageSrc = gallery[Math.min(activeImg, gallery.length - 1)] ?? product.img;

  const localizedOptionName = (o: StorefrontVariantDetail["options"][number]) =>
    tr(locale, o.nameNb ?? o.name, o.nameEn ?? o.name);

  const specLineBelowTitle =
    effectiveVariant?.sku
      ? `SKU · ${effectiveVariant.sku}`
      : effectiveVariant?.options?.length
        ? effectiveVariant.options.map((o) => localizedOptionName(o)).join(" · ")
        : product.spec;

  const specsForTable = effectiveVariant?.specs?.length ? effectiveVariant.specs : product.specs;

  const displayName = productLocalizedName(product, locale);
  const displayCategory = productLocalizedCategory(product, locale);
  const displayDescriptionHtml = productLocalizedDescriptionHtml(product, locale);
  const displayDescriptionPlain = productLocalizedPlainDescription(product, locale);

  const { formatMinorPrice, formatCardPrice } = useStorefrontPrice();
  const displayPrice = useMemo(() => {
    const minor =
      effectiveVariant?.priceNumericExVat ??
      (product.priceNumeric > 0 ? product.priceNumeric : null);
    return formatMinorPrice(minor);
  }, [effectiveVariant?.priceNumericExVat, product.priceNumeric, formatMinorPrice]);

  const pdpCustomFields = useMemo(() => {
    const fields: { label: string; value: string }[] = [];
    if (product.modelNumber?.trim()) {
      fields.push({
        label: tr(locale, "Modellnummer", "Model Number"),
        value: product.modelNumber.trim(),
      });
    }
    if (product.specifications?.trim()) {
      fields.push({
        label: tr(locale, "Spesifikasjoner", "Specifications"),
        value: product.specifications.trim(),
      });
    }
    if (product.oilCapacity?.trim()) {
      fields.push({
        label: tr(locale, "Oljekapasitet", "Oil Capacity"),
        value: product.oilCapacity.trim(),
      });
    }
    if (product.capacity?.trim()) {
      fields.push({
        label: tr(locale, "Kapasitet", "Capacity"),
        value: product.capacity.trim(),
      });
    }
    if (product.dimensions?.trim()) {
      fields.push({
        label: tr(locale, "Dimensjoner", "Dimensions"),
        value: product.dimensions.trim(),
      });
    }
    if (product.power?.trim()) {
      fields.push({
        label: tr(locale, "Effekt", "Power"),
        value: product.power.trim(),
      });
    }
    if (product.weight?.trim()) {
      fields.push({
        label: tr(locale, "Vekt", "Weight"),
        value: product.weight.trim(),
      });
    }

    return fields;
  }, [
    locale,
    product.modelNumber,
    product.specifications,
    product.oilCapacity,
    product.capacity,
    product.dimensions,
    product.power,
    product.weight,

  ]);

  const pickVariant = (id: string) => {
    setSelectedVid(id);
    router.replace(`/produkter/${encodeURIComponent(product.slug)}?v=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  const variantLabelOption = (v: StorefrontVariantDetail) =>
    v.options?.length
      ? v.options.map((o) => localizedOptionName(o)).join(" · ") ||
      tr(locale, v.nameNb ?? v.name, v.nameEn ?? v.name)
      : tr(locale, v.nameNb ?? v.name, v.nameEn ?? v.name) || v.sku;

  const handleAdd = async () => {
    clearLastActionError();
    setCartMessage(null);
    const snap = cartSnapshotFromProduct(
      { ...product, name: displayName, price: displayPrice },
      effectiveVariant,
    );
    const res = await addItemFromSnapshot(snap, qty);
    if (!res.ok) {
      setCartMessage(res.message);
      return;
    }
    setSidebarOpen(true);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const serviceLines = bulletsForLocale(product.serviceBulletsLocalized, locale);
  const quoteAsideLines = bulletsForLocale(product.quoteBulletsLocalized, locale);
  const svcIcons = [Truck, Wrench, ShieldCheck];

  const handleDownloadPdf = () => {
    // html2canvas (used by html2pdf.js) crashes when parsing modern oklch() colors from Tailwind v4.
    // The native browser print dialog is the only reliable way to generate PDFs with modern CSS features.
    window.print();
  };

  const reviews = product.reviews ?? [];

  return (
    <main className=" bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>


      <div className=" py-4 border-[var(--color-divider)] mt-[20px]">
        <div className="container-x">
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
            <Link href="/" className="hover:text-[var(--color-copper)] flex items-center justify-center"><Home className="h-3.5 w-3.5" /></Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/produkter" className="hover:text-[var(--color-copper)]">{tr(locale, "Produkter", "Products")}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-[var(--color-ink)] truncate">{displayName}</span>
          </div>
        </div>
      </div>


      <section className="bg-[var(--color-stone)] ">
        <div className="container-x grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-10">
          <aside className="hidden lg:block shrink-0 sticky top-[100px] h-max mb-10">
            <div className="bg-[#3eb1f0] text-white font-bold px-4 py-3.5 text-[15px]">
              {tr(locale, "Produkter", "Products")}
            </div>
            <nav className="bg-white border border-t-0 border-[var(--color-divider)]">
              {sidebarTree.length > 0 ? renderSidebarTree(sidebarTree) : null}
            </nav>
          </aside>
          <div className="min-w-0">
            <div className="grid lg:grid-cols-2 gap-10 bg-[#fbf9f7] p-[20px]">
              <Reveal>
                <div>
                  <div className="aspect-[4/3] bg-white border border-[var(--color-divider)] rounded-[3px] overflow-hidden relative">
                    {product.badge && (
                      <span className="absolute top-3 left-3 z-10 bg-[var(--color-copper)] text-white text-[10px] font-bold tracking-[0.14em] px-2 py-1 rounded-[2px] shadow-sm">
                        {product.badge}
                      </span>
                    )}
                    {isMissingStorefrontImageSource(mainImageSrc) ? (
                      <ImageUnavailablePlaceholder locale={locale} className="min-h-full" />
                    ) : (
                      <Image
                        src={mainImageSrc}
                        alt={displayName}
                        width={1024}
                        height={768}
                        className="h-full w-full object-cover transition-all duration-500"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        priority
                      />
                    )}
                  </div>
                  {gallery.length > 1 ? (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {gallery.slice(0, 10).map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          onClick={() => setActiveImg(i)}
                          className={`aspect-[4/3] bg-white border rounded-[2px] overflow-hidden transition-all ${activeImg === i
                            ? "border-[var(--color-copper)] ring-1 ring-[var(--color-copper)]"
                            : "border-[var(--color-divider)] hover:border-[var(--color-ink)]"
                            }`}
                          aria-label={tr(locale, `Bilde ${i + 1}`, `Image ${i + 1}`)}
                        >
                          {isMissingStorefrontImageSource(src) ? (
                            <ImageUnavailablePlaceholder locale={locale} className="min-h-full" />
                          ) : (
                            <Image
                              src={src}
                              alt=""
                              width={320}
                              height={240}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="lg:sticky lg:top-28">
                  <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] font-semibold">Tecno X</p>
                  <h1
                    className="mt-3 text-[26px] lg:text-[32px] font-bold text-[var(--color-ink)] tracking-[-0.025em] leading-[1.1]"
                    dangerouslySetInnerHTML={{
                      __html: displayName || "",
                    }}
                  />
                  {/*  <p className="mt-3 font-mono text-[13px] text-[var(--color-muted)]">{specLineBelowTitle}</p> */}

                  {effectiveVariant?.stockLevel?.trim() ? (
                    <p className="mt-2 text-[12px] text-[var(--color-muted)]">
                      {tr(locale, "Beholdningsstatus:", "Availability:")}{" "}
                      <span className={`font-mono font-bold ${effectiveVariant.stockLevel === "OUT_OF_STOCK" ? "text-red-600" : "text-[var(--color-ink)]"}`}>
                        {effectiveVariant.stockLevel === "IN_STOCK"
                          ? tr(locale, "På lager", "In stock")
                          : effectiveVariant.stockLevel === "OUT_OF_STOCK"
                            ? tr(locale, "Utsolgt", "Out of stock")
                            : effectiveVariant.stockLevel}
                      </span>
                    </p>
                  ) : null}



                  <p className="mt-6 text-[28px] font-bold text-[#3baaf2] tracking-[-0.02em]">{displayPrice}</p>
                  <p className="text-[12px] text-[var(--color-muted)]">
                    {tr(locale, "Frakt beregnes ved tilbud", "Shipping calculated at checkout/order")}
                  </p>



                  {pdpCustomFields.length > 0 ? (
                    <dl className="mt-6 space-y-1.5 border-t border-[var(--color-divider)] pt-6">
                      {pdpCustomFields.map((field) => (
                        <div key={field.label} className="flex flex-wrap gap-x-2 gap-y-0.5 text-[12px]">
                          <dt className="font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                            {field.label}:
                          </dt>
                          <dd className="text-[var(--color-ink)]">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {variants.length > 1 ? (
                    <div className="mt-6">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] mb-2">
                        VARIATION :
                      </label>
                      <div className="relative max-w-md">
                        <select
                          value={selectedVid}
                          onChange={(e) => pickVariant(e.target.value)}
                          className="w-full appearance-none bg-white border border-[var(--color-divider)] rounded-[2px] px-4 py-3 pr-10 text-[14px] font-medium text-[var(--color-ink)] cursor-pointer hover:border-[var(--color-copper)] focus:outline-none focus:border-[var(--color-copper)]"
                        >
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {variantLabelOption(v)}
                              {v.stockLevel === "OUT_OF_STOCK" ? ` (${tr(locale, "Utsolgt", "Out of stock")})` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-stretch border border-[var(--color-divider)] rounded-[2px] overflow-hidden bg-white">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 hover:bg-[#f8f8f8] transition-colors"><Minus className="h-4 w-4" /></button>
                      <span className="px-4 py-2.5 min-w-10 text-center font-bold text-[14px]">{qty}</span>
                      <button type="button" onClick={() => setQty((q) => q + 1)} className="px-3 hover:bg-[#f8f8f8] transition-colors"><Plus className="h-4 w-4" /></button>
                    </div>
                    <button type="button" onClick={() => void handleAdd()} disabled={syncing || effectiveVariant?.stockLevel === "OUT_OF_STOCK"} className="bg-[#3eb1f0] hover:bg-[#32a0db] text-white px-6 py-2.5 font-bold text-[14px] rounded-[2px] flex items-center gap-2 transition-colors disabled:opacity-60">
                      <ShoppingBag className="h-4 w-4" />
                      {effectiveVariant?.stockLevel === "OUT_OF_STOCK" ? tr(locale, "Utsolgt", "Out of stock") : added ? tr(locale, "Lagt til", "Added") : syncing ? tr(locale, "Legger til …", "Adding …") : tr(locale, "Legg i kurv", "Add to cart")}
                    </button>
                    <div className="flex items-center ml-2">
                      <button onClick={handleDownloadPdf} type="button" className="p-3 bg-[#f8f8f8] hover:bg-[#eaeaea] text-[var(--color-ink)] transition-colors rounded-[2px] ml-4" aria-label="Last ned PDF">
                        <FileDown className="h-5 w-5" />
                      </button>
                      <button onClick={() => window.print()} type="button" className="p-3 bg-[#f8f8f8] hover:bg-[#eaeaea] text-[var(--color-ink)] transition-colors rounded-[2px]" aria-label="Skriv ut side">
                        <Printer className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {added && (
                    <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--color-copper)]">
                      <Check className="h-4 w-4" /> {tr(locale, "Produktet er lagt i handlekurven.", "Product added to cart.")}
                    </p>
                  )}
                  {(cartMessage || lastActionError) && (
                    <p className="mt-3 text-[13px] text-red-700" role="alert">
                      {cartMessage ?? lastActionError}
                    </p>
                  )}

                  <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-[var(--color-divider)] pt-6">
                    <div className="flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
                      <Truck className="h-4 w-4 text-[#3baaf2]" strokeWidth={1.5} />
                      {tr(locale, "Levering hele Norge", "Delivery across Norway")}
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
                      <Wrench className="h-4 w-4 text-[#3baaf2]" strokeWidth={1.5} />
                      {tr(locale, "Montering og opplæring", "Installation and training")}
                    </div>
                  </div>
                </div> {/* End of right col content */}
              </Reveal>
            </div> {/* End of grid-cols-2 */}

            {/* Tabs Area */}
            <div className="mt-12  bg-[#FBF9F7] p-[30px] rounded-[10px] mb-[50px]">
              <div className="inline-block items-end gap-6 ">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`px-6 py-3 text-[14px] pr-20 font-bold transition-colors mr-6  mb-2 cursor-pointer ${activeTab === "description" ? "bg-[#3eb1f0] text-white" : "bg-white text-[var(--color-ink)] border border-[var(--color-divider)] "}`}
                >
                  {tr(locale, "Beskrivelse", "Description")}
                </button>
                <button
                  onClick={() => setActiveTab("downloads")}
                  className={`px-6 py-3 text-[14px]  pr-20  font-bold transition-colors  mr-6  mb-2  cursor-pointer ${activeTab === "downloads" ? "bg-[#3eb1f0] text-white" : "bg-white text-[var(--color-ink)] border border-[var(--color-divider)] "}`}
                >
                  {tr(locale, "Nedlastinger", "Downloads")}
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`px-6 py-3 text-[14px]  pr-20  font-bold transition-colors mr-6 mb-2 cursor-pointer ${activeTab === "contact" ? "bg-[#3eb1f0] text-white" : "bg-white text-[var(--color-ink)] border border-[var(--color-divider)]  "}`}
                >
                  {tr(locale, "Kontakt Oss", "Contact Us")}
                </button>
              </div>

              <div className="bg-trnsparent rounded-[10px] border-[var(--color-divider)] p-6 lg:p-8">
                {activeTab === "description" && (
                  <div>
                    {displayDescriptionHtml.trim() ? (
                      <div
                        className="text-[14px] leading-[1.7] text-[var(--color-ink)]/90 prose-like [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mt-4 first:[&_p]:mt-0"
                        dangerouslySetInnerHTML={{ __html: displayDescriptionHtml }}
                      />
                    ) : displayDescriptionPlain.trim() ? (
                      <p className="text-[14px] leading-[1.7] text-[var(--color-ink)]/90">{displayDescriptionPlain}</p>
                    ) : (
                      <p className="text-[14px] text-[var(--color-muted)]">
                        {tr(locale, "Ingen beskrivelse tilgjengelig.", "No description available.")}
                      </p>
                    )}
                  </div>
                )}
                {activeTab === "downloads" && (
                  <div className="py-8">
                    {product.downloads && product.downloads.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {product.downloads.map(d => (
                          <a key={d.id} href={d.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-[var(--color-divider)] rounded hover:border-[var(--color-copper)] transition-colors group">
                            <div className="bg-[#f8f8f8] p-2 rounded group-hover:bg-[#ebf5ff] transition-colors">
                              <FileDown className="h-5 w-5 text-[var(--color-muted)] group-hover:text-[#3baaf2]" />
                            </div>
                            <span className="text-[14px] font-medium text-[var(--color-ink)] group-hover:text-[#3baaf2] transition-colors">{d.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--color-muted)]">{tr(locale, "Ingen nedlastinger tilgjengelig for dette produktet.", "No downloads available for this product.")}</p>
                    )}
                  </div>
                )}
                {activeTab === "contact" && (
                  <ProductQuoteForm productSlug={product.slug} productName={displayName} locale={locale} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/*    <section className="bg-[var(--color-dark-bg)] text-[var(--color-stone)] py-16 lg:py-24">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl mb-10">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Tekniske spesifikasjoner", "Technical specifications")}
              </span>
              <h2 className="mt-5 display-h3 text-white">
                {tr(locale, "Alt du trenger å vite — i tall.", "Everything you need to know - in numbers.")}
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-x-auto border border-[var(--color-dark-border)] rounded-[3px]">
              <table className="w-full text-[14px]">
                <tbody>
                  {specsForTable.map((s, i) => (
                    <tr
                      key={`${s.label}-${i}`}
                      className={i % 2 === 0 ? "bg-[oklch(0.18_0_0)]" : "bg-[oklch(0.21_0_0)]"}
                    >
                      <th className="text-left px-5 py-4 text-[12px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)] font-semibold w-1/2 lg:w-1/3">
                        {s.label}
                      </th>
                      <td className="px-5 py-4 text-white font-mono">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section> */}

      {reviews.length > 0 ? (
        <section className="bg-[var(--color-stone)] py-16 lg:py-24 border-y border-[var(--color-divider)]">
          <div className="container-x">
            <Reveal>
              <div className="mb-10 max-w-3xl">
                <span className="label-tag inline-flex items-center gap-2">
                  <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                  {tr(locale, "Kundeanmeldelser", "Customer reviews")}
                </span>
                <h2 className="display-h3 mt-5 text-[var(--color-ink)]">
                  {tr(locale, "Stemmer fra kjøkkengulvet.", "Straight from professional kitchens.")}
                </h2>
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <Reveal key={`${r.author}-${i}`} delay={i * 0.05}>
                  <article className="h-full bg-white border border-[var(--color-divider)] rounded-[3px] p-6 flex flex-col">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: r.rating }, (_, ri) => (
                        <Star key={ri} className="h-3.5 w-3.5 fill-[var(--color-copper)] text-[var(--color-copper)]" />
                      ))}
                    </div>
                    <h3 className="mt-3 text-[16px] font-bold text-[var(--color-ink)] leading-snug">
                      {r.title?.trim()
                        ? r.title
                        : tr(locale, "Anbefales", "Recommended")}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.65] text-[var(--color-ink)]/88 flex-1">{r.body}</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      {r.author}
                      {r.dateIso?.trim()
                        ? ` · ${locale === "en" ? formatIsoShortEn(r.dateIso) : formatIsoShortNb(r.dateIso)}`
                        : ""}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/*  <ProductQuoteSection productSlug={product.slug} productName={displayName} locale={locale} quoteLines={quoteAsideLines} /> */}

      {relatedProducts.length > 0 && (
        <section className="bg-[var(--color-stone)] py-16 lg:py-24">
          <div className="container-x">
            <Reveal>
              <div className="mb-10 max-w-3xl">
                <span className="label-tag inline-flex items-center gap-2">
                  <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                  {tr(locale, "Lignende produkter", "Similar products")}
                </span>
                <h2 className="display-h3 mt-5 text-[var(--color-ink)]">
                  {tr(locale, "Andre i samme kategori.", "Others in the same category.")}
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-fr items-stretch gap-4 lg:gap-6">
              {relatedProducts.map((p, i) => {
                const relatedName = productLocalizedName(p, locale);
                const relatedPrice = formatCardPrice(p.priceNumeric > 0 ? p.priceNumeric : null);
                return (
                  <Reveal key={p.slug} delay={i * 0.06} className="h-full min-h-0">
                    <Link href={`/produkter/${p.slug}`} className="group card-elevated flex h-full min-h-0 flex-col">
                      <div className="aspect-[4/3] overflow-hidden bg-[var(--color-stone)]">
                        {typeof p.img === "string" ? (
                          <StorefrontRemoteImage
                            src={p.img}
                            alt={relatedName}
                            locale={locale}
                            className="transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                        ) : (
                          <Image
                            src={p.img}
                            alt={relatedName}
                            loading="lazy"
                            width={1024}
                            height={768}
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-[14px] font-bold text-[var(--color-ink)] leading-snug">{relatedName}</h3>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-muted)] font-medium">{displayBrandName(p.brand)}</p>
                        <p className="mt-2 text-[13px] font-bold text-[var(--color-copper)]">{relatedPrice}</p>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer
        locale={locale}
        rootCategories={megaMenuToFooterRoots(megaMenuByLocale ?? { nb: [], en: [] })}
      />

      {/* Hidden PDF template — client-only to avoid hydration noise */}
      {pdfMounted ? (
      <div id="pdf-content" style={{ display: "none", padding: "10px", color: "#000", backgroundColor: "#fff", fontFamily: "sans-serif" }}>
        {/* Header */}
        <div style={{ borderBottom: "2px solid #3baaf2", paddingBottom: "15px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "900", margin: 0, color: "#111", letterSpacing: "-1px" }}>TECNO X</h1>
            <p style={{ fontSize: "10px", margin: 0, color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Professional Gastro Equipment</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#3baaf2", fontWeight: "bold" }}>gastroline.no</p>
            <p style={{ margin: 0, fontSize: "10px", color: "#666" }}>Ring oss: 411 90 600</p>
          </div>
        </div>

        {/* Product Hero */}
        <div style={{ display: "flex", gap: "30px", marginBottom: "40px" }}>
          <div style={{ width: "50%", flexShrink: 0 }}>
            {mainImageSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={typeof mainImageSrc === 'string' ? mainImageSrc : (mainImageSrc as any).src} alt={displayName} crossOrigin="anonymous" style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: "4px", border: "1px solid #eaeaea", padding: "10px" }} />
            )}
          </div>
          <div style={{ width: "50%" }}>
            <h2 style={{ fontSize: "24px", margin: "0 0 15px 0", lineHeight: "1.2", color: "#111" }}>{displayName}</h2>
            <div style={{ fontSize: "26px", fontWeight: "bold", color: "#3baaf2", marginBottom: "20px" }}>{displayPrice}</div>

            <div style={{ backgroundColor: "#f8f8f8", padding: "15px", borderRadius: "4px" }}>
              <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", margin: "0 0 10px 0" }}>Specifications</h3>
              {pdpCustomFields.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  {pdpCustomFields.map(f => (
                    <div key={f.label} style={{ fontSize: "13px", display: "flex", borderBottom: "1px solid #eaeaea", paddingBottom: "4px" }}>
                      <span style={{ fontWeight: "600", width: "140px", color: "#444" }}>{f.label}:</span>
                      <span style={{ color: "#111" }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>{specLineBelowTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {displayDescriptionHtml && (
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#111", borderBottom: "1px solid #eaeaea", paddingBottom: "8px", marginBottom: "15px" }}>Description</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#444" }} dangerouslySetInnerHTML={{ __html: displayDescriptionHtml }} />
          </div>
        )}

        {/* Footer Note */}
        <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #eaeaea", textAlign: "center", fontSize: "10px", color: "#999" }}>
          © TECNO X AS • Alle priser inkl. MVA • Levering til hele Norge • Utstyret skal monteres av autorisert personell
        </div>
      </div>
      ) : null}
    </main>
  );
}

function bulletsForLocale(bundle: LocalizedBulletBundle | null | undefined, locale: Locale): string[] {
  if (!bundle) {
    return [
      tr(locale, "Levering hele Norge", "Delivery across Norway"),
      tr(locale, "Montering og opplæring", "Installation and training"),
      tr(locale, "2 års garanti", "2-year warranty"),
    ];
  }
  const key = locale === "en" ? "en" : "nb";
  const lines =
    bundle[key]?.length ?? 0 ? bundle[key]! : [...(bundle.nb.length ? bundle.nb : bundle.en)];
  if (!lines?.length) {
    return [
      tr(locale, "Levering hele Norge", "Delivery across Norway"),
      tr(locale, "Montering og opplæring", "Installation and training"),
      tr(locale, "2 års garanti", "2-year warranty"),
    ];
  }
  return lines.slice(0, 6);
}

function formatIsoShortNb(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatIsoShortEn(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function ProductQuoteForm({
  productSlug,
  productName,
  locale,
}: {
  productSlug: string;
  productName: string;
  locale: Locale;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (submitted) {
    return (
      <div className="bg-white border border-[var(--color-divider)] p-10 rounded-[3px] text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-copper)] text-white">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-[20px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
          {tr(locale, "Takk! Vi er på saken.", "Thanks! We are on it.")}
        </h3>
        <p className="mt-3 text-[14px] text-[var(--color-muted)]">
          {tr(locale, "En av våre fagfolk tar kontakt innen 24 timer.", "One of our specialists will contact you within 24 hours.")}
        </p>
      </div>
    );
  }

  return (
    <form
      className="bg-white border border-[var(--color-divider)] p-6 lg:p-8 rounded-[3px] space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const body = {
          name: fd.get("name"),
          company: fd.get("company"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          productSlug,
          productName,
          locale,
        };
        setSubmitting(true);
        try {
          const res = await fetch("/api/storefront/quote-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const json = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !json.ok) {
            setError(json.error ?? tr(locale, "Kunne ikke sende forespørselen.", "Could not send your request."));
            return;
          }
          setSubmitted(true);
        } catch {
          setError(tr(locale, "Nettverksfeil — prøv igjen.", "Network error — please try again."));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <QuoteField label={tr(locale, "Navn", "Name")} required type="text" name="name" disabled={submitting} />
        <QuoteField label={tr(locale, "Bedrift", "Company")} type="text" name="company" disabled={submitting} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <QuoteField label={tr(locale, "E-post", "Email")} required type="email" name="email" disabled={submitting} />
        <QuoteField label={tr(locale, "Telefon", "Phone")} type="tel" name="phone" disabled={submitting} />
      </div>
      <div>
        <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
          {tr(locale, "Melding", "Message")}
        </label>
        <textarea
          name="message"
          rows={4}
          required
          disabled={submitting}
          defaultValue={tr(locale, `Forespørsel om tilbud på: ${productName}`, `Quote request for: ${productName}`)}
          className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors resize-none disabled:opacity-60"
        />
      </div>
      {error ? <p className="text-[13px] text-red-700">{error}</p> : null}
      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto disabled:opacity-60">
        {submitting
          ? tr(locale, "Sender…", "Sending…")
          : tr(locale, "Send tilbudsforespørsel", "Send quote request")}
      </button>
    </form>
  );
}

function ProductQuoteSection({
  productSlug,
  productName,
  locale,
  quoteLines,
}: {
  productSlug: string;
  productName: string;
  locale: Locale;
  quoteLines: string[];
}) {
  return (
    <section className="bg-[var(--color-stone)] py-16 lg:py-20 border-t border-[var(--color-divider)]">
      <div className="container-x grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
        <Reveal className="sticky top-30 h-max">
          <div>
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {/* {tr(locale, "Be om tilbud", "Request a quote")} */}
            </span>
            <h2 className="mt-5 display-h3 text-[var(--color-ink)]">
              {tr(locale, "Ønsker du pris og leveringstid?", "Need pricing and delivery time?")}
            </h2>
            <p className="mt-4 text-[15px] text-[var(--color-muted)] leading-[1.65] max-w-md">
              {tr(
                locale,
                "Send forespørsel og få et skreddersydd tilbud — inkludert montering, opplæring og service. Vi svarer innen 24 timer.",
                "Send a request and receive a tailored quote including installation, training, and service. We reply within 24 hours.",
              )}
            </p>
            <ul className="mt-8 space-y-3 text-[13px] text-[var(--color-muted)]">
              {quoteLines.map((txt, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--color-copper)] shrink-0" /> {txt}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
function QuoteField({
  label,
  required,
  type,
  name,
  disabled,
}: {
  label: string;
  required?: boolean;
  type: string;
  name: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        disabled={disabled}
        className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors disabled:opacity-60"
      />
    </div>
  );
}

