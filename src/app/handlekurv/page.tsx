import type { Metadata } from "next";
import { HandlekurvView } from "@/components/site/HandlekurvView";

export const metadata: Metadata = {
  title: "Handlekurv",
  description: "Din handlekurv hos TECNOX. Send som tilbudsforespørsel og få fastpris innen 24 timer.",
};

export default function HandlekurvPage() {
  return <HandlekurvView />;
}
