import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "order-status-overlays.json");

export type OrderStatusOverlay = {
  orderId: string;
  customerId: string;
  orderCode: string;
  originalState: string;
  /** When true, UI shows `originalState` instead of Cancelled overlay. */
  reactivated: boolean;
  updatedAt: string;
};

async function readAll(): Promise<Record<string, OrderStatusOverlay>> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, OrderStatusOverlay>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, OrderStatusOverlay>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function markOrderCancelledOverlay(input: {
  orderId: string;
  customerId: string;
  orderCode: string;
  originalState: string;
}): Promise<OrderStatusOverlay> {
  const all = await readAll();
  const record: OrderStatusOverlay = {
    orderId: input.orderId,
    customerId: input.customerId,
    orderCode: input.orderCode,
    originalState: input.originalState,
    reactivated: false,
    updatedAt: new Date().toISOString(),
  };
  all[input.orderId] = record;
  await writeAll(all);
  return record;
}

export async function reactivateOrderOverlay(input: {
  orderId: string;
  customerId: string;
  orderCode: string;
  originalState: string;
}): Promise<OrderStatusOverlay> {
  const all = await readAll();
  const record: OrderStatusOverlay = {
    orderId: input.orderId,
    customerId: input.customerId,
    orderCode: input.orderCode,
    originalState: input.originalState,
    reactivated: true,
    updatedAt: new Date().toISOString(),
  };
  all[input.orderId] = record;
  await writeAll(all);
  return record;
}

export async function getOrderStatusOverlayMap(orderIds: string[]): Promise<Record<string, OrderStatusOverlay>> {
  const all = await readAll();
  const map: Record<string, OrderStatusOverlay> = {};
  for (const id of orderIds) {
    if (all[id]) map[id] = all[id];
  }
  return map;
}

