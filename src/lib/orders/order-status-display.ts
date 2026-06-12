export type OrderStatusOverlayView = {
  orderId: string;
  orderCode: string;
  originalState: string;
  reactivated: boolean;
};

export function resolveOrderDisplayState(
  vendureState: string,
  overlay: OrderStatusOverlayView | null | undefined,
): string {
  if (!overlay) return vendureState;
  if (overlay.reactivated) return overlay.originalState;
  return "Cancelled";
}

export function canCancelOrderState(displayState: string): boolean {
  return !["Cancelled", "Shipped", "Delivered", "PaymentSettled"].includes(displayState);
}
