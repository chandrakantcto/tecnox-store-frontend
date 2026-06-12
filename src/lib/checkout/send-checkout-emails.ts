import type { CheckoutFormValues } from "@/lib/checkout/validate";
import type { VendureCartLine } from "@/lib/vendure/cart-from-active-order";

export async function sendCheckoutEmails(input: {
  locale: string;
  authMode: "login" | "signup";
  accountCreated?: boolean;
  form: CheckoutFormValues;
  orderCode: string;
  lines: VendureCartLine[];
  subtotalKr: number;
}): Promise<void> {
  const lc = input.locale === "en" ? "en" : "nb";
  const fullName = `${input.form.firstName.trim()} ${input.form.lastName.trim()}`.trim();
  const orderDate = new Date().toLocaleDateString(lc === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const emailPayload = {
    locale: lc,
    firstName: input.form.firstName.trim(),
    lastName: input.form.lastName.trim(),
    email: input.form.email.trim().toLowerCase(),
    orderCode: input.orderCode,
    orderDate,
    company: input.form.company.trim() || undefined,
    totalWithTaxKr: input.subtotalKr,
    shippingAddress: {
      fullName,
      streetLine1: input.form.addressLine1.trim(),
      streetLine2: input.form.addressLine2.trim() || undefined,
      city: input.form.city.trim(),
      postalCode: input.form.postalCode.trim(),
      countryCode: input.form.countryCode.trim().toUpperCase().slice(0, 2),
      phoneNumber: input.form.phone.trim() || undefined,
    },
    lines:
      input.lines.length > 0
        ? input.lines.map((line) => ({
            productName: line.productName,
            spec: line.spec || line.brand || undefined,
            quantity: line.quantity,
            unitPriceKr: line.unitPriceKr,
            lineTotalKr: line.lineTotalKr,
            imageUrl: line.imageSrc || undefined,
          }))
        : [
            {
              productName: lc === "en" ? "Order items" : "Ordrevarer",
              quantity: 1,
              unitPriceKr: input.subtotalKr,
              lineTotalKr: input.subtotalKr,
            },
          ],
  };

  const orderMail = await fetch("/api/auth/send-order-confirmation-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailPayload),
  });

  const orderMailBody = await orderMail.json().catch(() => null);
  if (!orderMail.ok || orderMailBody?.success !== true) {
    console.error(
      "[checkout] order confirmation email failed",
      orderMail.status,
      orderMailBody?.error ?? orderMailBody,
    );
  }

  const shouldSendWelcome = input.accountCreated === true || input.authMode === "signup";
  if (shouldSendWelcome) {
    const regMail = await fetch("/api/auth/send-registration-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: input.form.firstName.trim(),
        lastName: input.form.lastName.trim(),
        email: input.form.email.trim().toLowerCase(),
        locale: lc,
      }),
    });
    const regMailBody = await regMail.json().catch(() => null);
    if (!regMail.ok || regMailBody?.success !== true) {
      console.error(
        "[checkout] registration email failed",
        regMail.status,
        regMailBody?.error ?? regMailBody,
      );
    }
  }
}
