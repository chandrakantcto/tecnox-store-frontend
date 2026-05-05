import type { Metadata } from "next";
import { KasseView } from "@/components/site/KasseView";

export const metadata: Metadata = {
  title: "Tilbudsforespørsel",
  description:
    "Fullfør tilbudsforespørselen din. Vi sender skreddersydd pris med leveranse, montering og opplæring innen 24 timer.",
};

export default function KassePage() {
  return <KasseView />;
}
