import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

function orgJsonLd(locale: "nb" | "en") {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TECNOX AS",
    description: tr(
      locale,
      "Profesjonelt kjøkkenutstyr for restaurant, kantine og storhusholdning. Levering, montering og service over hele Norge.",
      "Professional kitchen equipment for restaurants, canteens and large-scale catering. Delivery, installation and service across Norway.",
    ),
    url: "https://technox.lovable.app",
    telephone: "+47 922 22 800",
    email: "post@tecnox.no",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Adresseveien 1",
      postalCode: "0000",
      addressLocality: "Oslo",
      addressCountry: "NO",
    },
    areaServed: "NO",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "16:00",
      },
    ],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tecnox.no"),
    title: {
      default: tr(
        locale,
        "TECNOX — Profesjonelt kjøkkenutstyr for storhusholdning",
        "TECNOX — Professional kitchen equipment for large-scale catering",
      ),
      template: "%s — TECNOX",
    },
    description: tr(
      locale,
      "Over 5 000 produkter for restaurant, kantine og storhusholdning. Ledende europeiske merker, montering og service over hele Norge.",
      "Over 5,000 products for restaurants and large-scale catering. Leading European brands, installation and service across Norway.",
    ),
    authors: [{ name: "TECNOX" }],
    openGraph: {
      siteName: "TECNOX",
      locale: locale === "en" ? "en_GB" : "nb_NO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd(locale)) }}
        />
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
