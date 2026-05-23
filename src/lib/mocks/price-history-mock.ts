import type { PriceHistoryEntry } from "@/lib/types/price-history";

const MOCK_USER_IDS = [
  "8f3a1c2e-1111-4aaa-9b22-aaaaaaaaaaaa",
  "7d2b9f0c-2222-4bbb-8c33-bbbbbbbbbbbb",
  "6e1c8e1d-3333-4ccc-7d44-cccccccccccc",
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type GeneratePriceHistoryOptions = {
  count?: number;
  basePrice?: number;
  baseStock?: number;
  spanDays?: number;
};

export function generatePriceHistoryMock(
  productId: string,
  options: GeneratePriceHistoryOptions = {},
): PriceHistoryEntry[] {
  const {
    count = 18,
    basePrice = 1200,
    baseStock = 50,
    spanDays = 90,
  } = options;
  const rand = mulberry32(hashSeed(productId));
  const businessProductId = `bp-${productId}`;

  const now = Date.now();
  const spanMs = spanDays * 24 * 60 * 60 * 1000;

  let price = basePrice;
  let stock = baseStock;
  const entries: PriceHistoryEntry[] = [];

  for (let i = 0; i < count; i++) {
    const previousPrice = i === 0 ? null : price;
    const previousStock = i === 0 ? null : stock;

    const priceDelta = rand() * 0.3 - 0.12;
    const stockDelta = Math.round(rand() * 40 - 15);

    price = Math.max(50, Math.round(price * (1 + priceDelta)));
    stock = Math.max(0, stock + stockDelta);

    const offsetMs = Math.floor(spanMs * (i + rand() * 0.5)) / count;
    const createdAt = new Date(now - (spanMs - offsetMs)).toISOString();
    const includeUser = rand() > 0.25;

    entries.push({
      id: `ph-${productId}-${i}`,
      businessProductId,
      price,
      stock,
      previousPrice,
      previousStock,
      userId: includeUser
        ? MOCK_USER_IDS[Math.floor(rand() * MOCK_USER_IDS.length)]
        : null,
      createdAt,
    });
  }

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function filterByRange(
  entries: PriceHistoryEntry[],
  startDate: string,
  endDate: string,
): PriceHistoryEntry[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return entries.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return t >= start && t <= end;
  });
}
