import fs from "fs";
import path from "path";
import type { Attachment } from "nodemailer/lib/mailer";

export const EMAIL_CID = {
  logo: "tecno-logo@tecnox",
} as const;

function publicAsset(...segments: string[]): string {
  return path.join(process.cwd(), "public", ...segments);
}

function inlineAttachment(filePath: string, cid: string, filename: string): Attachment | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return {
      filename,
      path: filePath,
      cid,
      contentDisposition: "inline",
    };
  } catch {
    return null;
  }
}

/** Inline CID attachment for the TECNOX logo (reliable in Gmail/Outlook). */
export function getTecnoXEmailAttachments(): Attachment[] {
  const logo = inlineAttachment(publicAsset("logo-tecno-x.png"), EMAIL_CID.logo, "logo-tecno-x.png");
  return logo ? [logo] : [];
}

export function cidSrc(cid: string): string {
  return `cid:${cid}`;
}
