import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { sanitizeForFirestore } from "./firestore";
import {
  type ProductItem,
  type ProductVariant,
  initialProductsData,
  ensureProductHasVariants,
  saveProductToFirestore,
  fetchProductByIdFromFirestore,
  fetchProductsFromFirestore,
} from "./products";
import type { Order } from "./orders";

export type StockMovementType =
  | "initial" // Initial stock upon product creation
  | "restock" // Batch restock by admin
  | "sale" // Deducted on customer order placement
  | "order_cancel" // Restored upon order cancellation
  | "return_restock" // Inspected return garment restored to stock
  | "exchange_dispatch" // Replacement size garment dispatched to customer
  | "adjustment"; // Count correction or manual administrative audit

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantSku?: string;
  variantColor?: string;
  variantSize?: string;
  type: StockMovementType;
  quantityDelta: number; // Positive for additions, negative for deductions
  previousStock: number;
  newStock: number;
  referenceId?: string; // Order Number, Return Ticket Number, or Batch PO
  note: string;
  performedBy: string; // "Admin Atelier Desk", "Customer Checkout", "Return Audit", etc.
  createdAt: string; // ISO string
}

const STOCK_MOVEMENTS_CACHE_KEY = "fedoll_stock_movements_v1";

const getLocalMovements = (): StockMovement[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STOCK_MOVEMENTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalMovements = (movements: StockMovement[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STOCK_MOVEMENTS_CACHE_KEY, JSON.stringify(movements));
  } catch (err) {
    console.warn("Failed to cache stock movements locally:", err);
  }
};

/**
 * Fetch all stock movements, optionally filtered by product ID
 */
export const fetchStockMovements = async (
  productId?: string,
  limitCount: number = 100
): Promise<StockMovement[]> => {
  let firestoreRecords: StockMovement[] = [];
  try {
    const movementsCol = collection(db, "stock_movements");
    let q = query(movementsCol, orderBy("createdAt", "desc"), limit(limitCount));

    if (productId) {
      q = query(
        movementsCol,
        where("productId", "==", productId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const snap = await getDocs(q);
    if (!snap.empty) {
      firestoreRecords = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      })) as StockMovement[];
    }
  } catch (err) {
    console.warn("Error fetching stock movements from Firestore:", err);
  }

  // Merge Firestore records with local movements so that immediate actions (sales, restocks) are never lost
  const localMovements = getLocalMovements();
  const movementMap = new Map<string, StockMovement>();
  localMovements.forEach((m) => movementMap.set(m.id, m));
  firestoreRecords.forEach((m) => movementMap.set(m.id, m));

  const merged = Array.from(movementMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  saveLocalMovements(merged);

  if (productId) {
    return merged.filter((m) => m.productId === productId).slice(0, limitCount);
  }
  return merged.slice(0, limitCount);
};

/**
 * Record an immutable stock movement entry
 */
export const recordStockMovement = async (
  movement: Omit<StockMovement, "id" | "createdAt">
): Promise<StockMovement> => {
  const id = `mov_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();

  const fullMovement: StockMovement = {
    ...movement,
    id,
    createdAt: nowIso,
  };

  try {
    const docRef = doc(db, "stock_movements", id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...fullMovement,
        timestamp: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn("Failed to write stock movement to Firestore:", err);
  }

  // Update local cache
  const existing = getLocalMovements();
  const updated = [fullMovement, ...existing.filter((m) => m.id !== id)].slice(0, 500);
  saveLocalMovements(updated);

  return fullMovement;
};

/**
 * Admin: Add Restock to a Product or specific Variant
 */
export const restockProductOrVariant = async (params: {
  productId: string;
  variantId?: string;
  quantityToAdd: number;
  note?: string;
  performedBy?: string;
  product?: ProductItem;
}): Promise<{ success: boolean; newStock: number; updatedProduct?: ProductItem }> => {
  const { productId, variantId, quantityToAdd, note, performedBy = "Admin Atelier Desk" } = params;

  const qty = Math.max(1, Math.floor(Number(quantityToAdd) || 0));
  if (qty <= 0) {
    throw new Error("Restock quantity must be at least 1 unit.");
  }

  // 1. Direct object passed from caller
  let product: ProductItem | null = params.product ? ensureProductHasVariants(params.product) : null;

  // 2. Fetch by ID
  if (!product && productId) {
    product = await fetchProductByIdFromFirestore(productId);
  }

  // 3. Fallback to all Firestore & local products
  if (!product && productId) {
    const all = await fetchProductsFromFirestore();
    const cleanId = String(productId).trim().toLowerCase();
    product =
      all.find(
        (p) =>
          String(p.id).trim().toLowerCase() === cleanId ||
          String(p.name || "").trim().toLowerCase() === cleanId
      ) || null;
  }

  // 4. Fallback to initial mock catalog
  if (!product && productId) {
    const cleanId = String(productId).trim().toLowerCase();
    const fallback = initialProductsData.find(
      (p) =>
        String(p.id).trim().toLowerCase() === cleanId ||
        String(p.name || "").trim().toLowerCase() === cleanId
    );
    if (fallback) product = ensureProductHasVariants(fallback);
  }

  if (!product) {
    throw new Error(`Product with ID "${productId}" not found. Please refresh the inventory page.`);
  }

  // Ensure product has synthesized variants if none exist
  const productWithVars = ensureProductHasVariants(product);
  const previousTotalStock = Number(productWithVars.stockCount) || 0;
  let newTotalStock = previousTotalStock + qty;
  let variantColor = "";
  let variantSize = "";
  let variantSku = "";
  let prevVariantStock = 0;
  let newVariantStock = 0;

  let updatedVariants = productWithVars.variants ? [...productWithVars.variants] : [];

  const isSpecificVariant = variantId && variantId !== "all";

  if (isSpecificVariant && updatedVariants.length > 0) {
    const varIdx = updatedVariants.findIndex((v) => String(v.id) === String(variantId));
    if (varIdx >= 0) {
      const v = updatedVariants[varIdx];
      prevVariantStock = Number(v.stockCount) || 0;
      newVariantStock = prevVariantStock + qty;
      variantColor = String(v.color || "");
      variantSize = String(v.size || "");
      variantSku = String(v.sku || "");

      updatedVariants[varIdx] = {
        ...v,
        stockCount: newVariantStock,
        inStock: newVariantStock > 0,
      };

      // Recalculate total product stock as sum of variants
      newTotalStock = updatedVariants.reduce((sum, item) => sum + (Number(item.stockCount) || 0), 0);
    } else {
      newTotalStock = previousTotalStock + qty;
    }
  } else {
    // If restock is for all variants, distribute evenly
    if (updatedVariants.length > 0) {
      const perVar = Math.floor(qty / updatedVariants.length);
      const remainder = qty % updatedVariants.length;
      updatedVariants = updatedVariants.map((v, i) => {
        const added = perVar + (i === 0 ? remainder : 0);
        const next = (Number(v.stockCount) || 0) + added;
        return {
          ...v,
          stockCount: next,
          inStock: next > 0,
        };
      });
      newTotalStock = updatedVariants.reduce((sum, item) => sum + (Number(item.stockCount) || 0), 0);
    } else {
      newTotalStock = previousTotalStock + qty;
    }
  }

  const updatedProduct: ProductItem = {
    ...productWithVars,
    variants: updatedVariants.length > 0 ? updatedVariants : undefined,
    stockCount: newTotalStock,
    inStock: newTotalStock > 0,
  };

  try {
    await saveProductToFirestore(updatedProduct);
  } catch (saveErr) {
    console.warn("Could not save restocked product to Firestore/cache:", saveErr);
  }

  // Record ledger movement safely
  try {
    await recordStockMovement({
      productId: String(product.id),
      productName: product.name || "Catalog Product",
      productImage: (product.images && product.images[0]) || "",
      variantId: isSpecificVariant ? variantId : undefined,
      variantSku: variantSku || undefined,
      variantColor: variantColor || undefined,
      variantSize: variantSize || undefined,
      type: "restock",
      quantityDelta: qty,
      previousStock: isSpecificVariant ? prevVariantStock : previousTotalStock,
      newStock: isSpecificVariant ? newVariantStock : newTotalStock,
      note: note || `Restocked +${qty} units at Atelier Hub.`,
      performedBy,
    });
  } catch (movErr) {
    console.warn("Could not record restock ledger entry:", movErr);
  }

  return { success: true, newStock: newTotalStock, updatedProduct };
};

/**
 * Smart Variant Matcher
 * Resolves the best matching variant for any size/color combination,
 * gracefully handling generic values ("Standard", "Default", "all")
 * and selecting available stock variants so variant stock is always updated.
 */
export const findMatchingVariantIndex = (
  variants: ProductVariant[],
  targetSize?: string,
  targetColor?: string
): number => {
  if (!variants || variants.length === 0) return -1;

  const rawSize = String(targetSize || "").trim().toLowerCase();
  const rawColor = String(targetColor || "").trim().toLowerCase();

  const isGenericSize =
    !rawSize ||
    ["standard", "default", "all", "onesize", "one size", "free", "regular", "universal"].includes(
      rawSize
    );
  const isGenericColor =
    !rawColor || ["default", "all", "standard", "multi"].includes(rawColor);

  // 1. Exact match on both size and color (if specific)
  if (!isGenericSize && !isGenericColor) {
    const exactIdx = variants.findIndex(
      (v) =>
        String(v.size || "").trim().toLowerCase() === rawSize &&
        String(v.color || "").trim().toLowerCase() === rawColor
    );
    if (exactIdx >= 0) return exactIdx;
  }

  // 2. Match size
  if (!isGenericSize) {
    const sizeWithStockIdx = variants.findIndex(
      (v) =>
        String(v.size || "").trim().toLowerCase() === rawSize &&
        (Number(v.stockCount) || 0) > 0
    );
    if (sizeWithStockIdx >= 0) return sizeWithStockIdx;

    const sizeIdx = variants.findIndex(
      (v) => String(v.size || "").trim().toLowerCase() === rawSize
    );
    if (sizeIdx >= 0) return sizeIdx;
  }

  // 3. Match color
  if (!isGenericColor) {
    const colorWithStockIdx = variants.findIndex(
      (v) =>
        String(v.color || "").trim().toLowerCase() === rawColor &&
        (Number(v.stockCount) || 0) > 0
    );
    if (colorWithStockIdx >= 0) return colorWithStockIdx;

    const colorIdx = variants.findIndex(
      (v) => String(v.color || "").trim().toLowerCase() === rawColor
    );
    if (colorIdx >= 0) return colorIdx;
  }

  // 4. Fallback: variant with positive stock
  const inStockIdx = variants.findIndex((v) => (Number(v.stockCount) || 0) > 0);
  if (inStockIdx >= 0) return inStockIdx;

  // 5. Fallback to first variant
  return 0;
};

/**
 * Universal product locator across Firestore, local cache, and catalog
 */
const findProductByQueryOrId = async (
  idOrName: string,
  preferredProducts?: ProductItem[]
): Promise<ProductItem | null> => {
  if (!idOrName) return null;
  const clean = String(idOrName).trim();
  const lower = clean.toLowerCase();

  // 1. Check preferred products if passed
  if (preferredProducts && preferredProducts.length > 0) {
    const pMatch = preferredProducts.find(
      (p) =>
        String(p.id).trim().toLowerCase() === lower ||
        String(p.name || "").trim().toLowerCase() === lower ||
        lower.includes(String(p.name || "").trim().toLowerCase())
    );
    if (pMatch) return ensureProductHasVariants(pMatch);
  }

  // 2. Fetch by direct ID
  const direct = await fetchProductByIdFromFirestore(clean);
  if (direct) return ensureProductHasVariants(direct);

  // 3. Fetch all products from Firestore & local cache
  const all = await fetchProductsFromFirestore();
  const found = all.find(
    (p) =>
      String(p.id).trim().toLowerCase() === lower ||
      String(p.name || "").trim().toLowerCase() === lower ||
      lower.includes(String(p.name || "").trim().toLowerCase()) ||
      String(p.name || "").trim().toLowerCase().includes(lower.split("(")[0].split("-")[0].trim())
  );
  if (found) return ensureProductHasVariants(found);

  // 4. Fallback to initialProductsData
  const fallback = initialProductsData.find(
    (p) =>
      String(p.id).trim().toLowerCase() === lower ||
      String(p.name || "").trim().toLowerCase() === lower ||
      lower.includes(String(p.name || "").trim().toLowerCase()) ||
      String(p.name || "").trim().toLowerCase().includes(lower.split("(")[0].split("-")[0].trim())
  );
  return fallback ? ensureProductHasVariants(fallback) : null;
};

/**
 * Extract size and color from natural language item details string
 */
const extractSizeAndColor = (
  text: string,
  availableVariants?: ProductVariant[]
): { size?: string; color?: string } => {
  const lower = String(text || "").toLowerCase();
  let size: string | undefined;
  let color: string | undefined;

  // 1. Check if any available variant's size is contained in the text
  if (availableVariants && availableVariants.length > 0) {
    const sortedSizes = [...availableVariants]
      .map((v) => String(v.size || "").trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    for (const s of sortedSizes) {
      const sLower = s.toLowerCase();
      const regex = new RegExp(`(?:size[:\\s-]*|\\(|\\b)${sLower}(?:\\)|\\b|,|$)`, "i");
      if (regex.test(lower)) {
        size = s;
        break;
      }
    }

    const sortedColors = [...availableVariants]
      .map((v) => String(v.color || "").trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    for (const c of sortedColors) {
      const cLower = c.toLowerCase();
      if (lower.includes(cLower)) {
        color = c;
        break;
      }
    }
  }

  // 2. Generic regex for size if still not identified: e.g. "Size: 42", "Size M", "Size: XL"
  if (!size) {
    const sizeMatch = lower.match(/(?:size|sz)[:\s-]*([a-z0-9]+)/i);
    if (sizeMatch) {
      size = sizeMatch[1].trim().toUpperCase();
    }
  }

  // 3. Common size abbreviations: e.g. (40) or (42) or (M) or (XL)
  if (!size) {
    const parenMatch = lower.match(/\b(xs|s|m|l|xl|xxl|2xl|3xl|38|40|42|44|46)\b/i);
    if (parenMatch) {
      size = parenMatch[1].trim().toUpperCase();
    }
  }

  return { size, color };
};

/**
 * Helper to fetch order from Firestore without circular dependency
 */
const fetchOrderDocumentSafe = async (orderNumber: string): Promise<Order | null> => {
  try {
    const ordersCol = collection(db, "orders");
    const clean = orderNumber.trim().toUpperCase();
    const q = query(ordersCol, where("orderNumber", "==", clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...(snap.docs[0].data() as DocumentData) } as Order;
    }
  } catch (err) {
    console.warn("Could not fetch order document in stock module:", err);
  }
  return null;
};

/**
 * Automatically deduct inventory when a customer places an order
 */
export const deductStockForOrder = async (order: Order): Promise<void> => {
  if (!order || !order.items || order.items.length === 0) return;

  for (const item of order.items) {
    try {
      const productId = String(item.id);
      let product = await findProductByQueryOrId(productId);
      if (!product && item.name) {
        product = await findProductByQueryOrId(item.name);
      }

      if (!product) {
        console.warn(`Product ${item.name} (${productId}) not found for stock deduction.`);
        continue;
      }

      const productWithVars = ensureProductHasVariants(product);
      const qtyToDeduct = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const previousTotalStock = Number(productWithVars.stockCount) || 0;

      let matchedVariantId: string | undefined;
      let matchedVariantSku: string | undefined;
      let matchedVariantColor = item.color;
      let matchedVariantSize = item.size;
      let prevVariantStock = 0;
      let newVariantStock = 0;

      let updatedVariants = productWithVars.variants ? [...productWithVars.variants] : [];

      if (updatedVariants.length > 0) {
        const varIdx = findMatchingVariantIndex(updatedVariants, item.size, item.color);
        if (varIdx >= 0) {
          const targetVariant = updatedVariants[varIdx];
          matchedVariantId = targetVariant.id;
          matchedVariantSku = targetVariant.sku;
          matchedVariantColor = targetVariant.color;
          matchedVariantSize = targetVariant.size;
          prevVariantStock = Number(targetVariant.stockCount) || 0;
          newVariantStock = Math.max(0, prevVariantStock - qtyToDeduct);

          updatedVariants[varIdx] = {
            ...targetVariant,
            stockCount: newVariantStock,
            inStock: newVariantStock > 0,
          };
        }
      }

      const newTotalStock =
        updatedVariants.length > 0
          ? updatedVariants.reduce((sum, v) => sum + (Number(v.stockCount) || 0), 0)
          : Math.max(0, previousTotalStock - qtyToDeduct);

      const updatedProduct: ProductItem = {
        ...productWithVars,
        variants: updatedVariants.length > 0 ? updatedVariants : undefined,
        stockCount: newTotalStock,
        inStock: newTotalStock > 0,
      };

      await saveProductToFirestore(updatedProduct);

      // Record sale movement in Firestore ledger & local cache
      await recordStockMovement({
        productId: String(productWithVars.id),
        productName: productWithVars.name,
        productImage: item.image || productWithVars.images?.[0] || "",
        variantId: matchedVariantId,
        variantSku: matchedVariantSku,
        variantColor: matchedVariantColor,
        variantSize: matchedVariantSize,
        type: "sale",
        quantityDelta: -qtyToDeduct,
        previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
        newStock: matchedVariantId ? newVariantStock : newTotalStock,
        referenceId: order.orderNumber,
        note: `Sold via Order #${order.orderNumber} to ${order.customerName} (${matchedVariantColor || "Default"} / ${matchedVariantSize || "Standard"})`,
        performedBy: "Checkout System",
      });
    } catch (itemErr) {
      console.warn(`Error deducting stock for item ${item.name}:`, itemErr);
    }
  }
};

/**
 * Automatically restore inventory when an order is cancelled
 */
export const restoreStockForOrder = async (
  order: Order,
  reason?: string
): Promise<void> => {
  if (!order || !order.items || order.items.length === 0) return;

  for (const item of order.items) {
    try {
      const productId = String(item.id);
      let product = await findProductByQueryOrId(productId);
      if (!product && item.name) {
        product = await findProductByQueryOrId(item.name);
      }

      if (!product) continue;

      const productWithVars = ensureProductHasVariants(product);
      const qtyToRestore = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const previousTotalStock = Number(productWithVars.stockCount) || 0;

      let matchedVariantId: string | undefined;
      let matchedVariantSku: string | undefined;
      let matchedVariantColor = item.color;
      let matchedVariantSize = item.size;
      let prevVariantStock = 0;
      let newVariantStock = 0;

      let updatedVariants = productWithVars.variants ? [...productWithVars.variants] : [];

      if (updatedVariants.length > 0) {
        const varIdx = findMatchingVariantIndex(updatedVariants, item.size, item.color);
        if (varIdx >= 0) {
          const targetVariant = updatedVariants[varIdx];
          matchedVariantId = targetVariant.id;
          matchedVariantSku = targetVariant.sku;
          matchedVariantColor = targetVariant.color;
          matchedVariantSize = targetVariant.size;
          prevVariantStock = Number(targetVariant.stockCount) || 0;
          newVariantStock = prevVariantStock + qtyToRestore;

          updatedVariants[varIdx] = {
            ...targetVariant,
            stockCount: newVariantStock,
            inStock: true,
          };
        }
      }

      const newTotalStock =
        updatedVariants.length > 0
          ? updatedVariants.reduce((sum, v) => sum + (Number(v.stockCount) || 0), 0)
          : previousTotalStock + qtyToRestore;

      const updatedProduct: ProductItem = {
        ...productWithVars,
        variants: updatedVariants.length > 0 ? updatedVariants : undefined,
        stockCount: newTotalStock,
        inStock: true,
      };

      await saveProductToFirestore(updatedProduct);

      // Record cancel reversal movement in Firestore ledger
      await recordStockMovement({
        productId: String(productWithVars.id),
        productName: productWithVars.name,
        productImage: item.image || productWithVars.images?.[0] || "",
        variantId: matchedVariantId,
        variantSku: matchedVariantSku,
        variantColor: matchedVariantColor,
        variantSize: matchedVariantSize,
        type: "order_cancel",
        quantityDelta: qtyToRestore,
        previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
        newStock: matchedVariantId ? newVariantStock : newTotalStock,
        referenceId: order.orderNumber,
        note: `Order #${order.orderNumber} cancelled. Restored +${qtyToRestore} units (${matchedVariantColor || "Default"} / ${matchedVariantSize || "Standard"}). ${reason ? `(${reason})` : ""}`,
        performedBy: "Admin Order Manager",
      });
    } catch (err) {
      console.warn(`Error restoring stock for item ${item.name}:`, err);
    }
  }
};

/**
 * Restock an approved pristine return garment back into live inventory
 */
export const restockReturnedItem = async (params: {
  ticketNumber: string;
  orderNumber?: string;
  itemDetails: string;
  quantity?: number;
  performedBy?: string;
  notes?: string;
}): Promise<void> => {
  const { ticketNumber, orderNumber, itemDetails, quantity = 1, performedBy = "Atelier Quality Audit", notes } = params;
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));

  // 1. Try resolving product from Order items if orderNumber is available
  let matchedProduct: ProductItem | null = null;
  let preferredSize: string | undefined;
  let preferredColor: string | undefined;

  if (orderNumber) {
    try {
      const order = await fetchOrderDocumentSafe(orderNumber);
      if (order && order.items && order.items.length > 0) {
        const itemLower = String(itemDetails || "").toLowerCase();
        const matchedItem =
          order.items.find(
            (i) =>
              itemLower.includes(String(i.name || "").toLowerCase()) ||
              String(i.name || "").toLowerCase().includes(itemLower.split("(")[0].trim())
          ) || order.items[0];

        if (matchedItem) {
          matchedProduct = await findProductByQueryOrId(String(matchedItem.id));
          if (!matchedProduct && matchedItem.name) {
            matchedProduct = await findProductByQueryOrId(matchedItem.name);
          }
          preferredSize = matchedItem.size;
          preferredColor = matchedItem.color;
        }
      }
    } catch (orderErr) {
      console.warn("Could not inspect order for return restock:", orderErr);
    }
  }

  // 2. Fallback to direct search from catalog
  if (!matchedProduct) {
    matchedProduct = await findProductByQueryOrId(itemDetails);
  }

  if (!matchedProduct) {
    console.warn(`Could not automatically locate product for return details: "${itemDetails}"`);
    return;
  }

  const productWithVars = ensureProductHasVariants(matchedProduct);
  const previousTotalStock = Number(productWithVars.stockCount) || 0;

  // Extract size & color from itemDetails or fallback to preferred order size/color
  const parsed = extractSizeAndColor(itemDetails, productWithVars.variants);
  const targetSize = parsed.size || preferredSize;
  const targetColor = parsed.color || preferredColor;

  let matchedVariantId: string | undefined;
  let matchedVariantSku: string | undefined;
  let matchedVariantColor = targetColor;
  let matchedVariantSize = targetSize;
  let prevVariantStock = 0;
  let newVariantStock = 0;

  let updatedVariants = productWithVars.variants ? [...productWithVars.variants] : [];

  if (updatedVariants.length > 0) {
    const varIdx = findMatchingVariantIndex(updatedVariants, targetSize, targetColor);
    if (varIdx >= 0) {
      const v = updatedVariants[varIdx];
      matchedVariantId = v.id;
      matchedVariantSku = v.sku;
      matchedVariantColor = v.color;
      matchedVariantSize = v.size;
      prevVariantStock = Number(v.stockCount) || 0;
      newVariantStock = prevVariantStock + qty;

      updatedVariants[varIdx] = {
        ...v,
        stockCount: newVariantStock,
        inStock: true,
      };
    }
  }

  const newTotalStock =
    updatedVariants.length > 0
      ? updatedVariants.reduce((sum, item) => sum + (Number(item.stockCount) || 0), 0)
      : previousTotalStock + qty;

  const updatedProduct: ProductItem = {
    ...productWithVars,
    variants: updatedVariants.length > 0 ? updatedVariants : undefined,
    stockCount: newTotalStock,
    inStock: true,
  };

  await saveProductToFirestore(updatedProduct);

  await recordStockMovement({
    productId: String(productWithVars.id),
    productName: productWithVars.name,
    productImage: productWithVars.images?.[0] || "",
    variantId: matchedVariantId,
    variantSku: matchedVariantSku,
    variantColor: matchedVariantColor,
    variantSize: matchedVariantSize,
    type: "return_restock",
    quantityDelta: qty,
    previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
    newStock: matchedVariantId ? newVariantStock : newTotalStock,
    referenceId: ticketNumber,
    note:
      notes ||
      `Return Ticket #${ticketNumber} passed quality audit. Restored +${qty} pristine garment to inventory (${matchedVariantColor || "Std"} / ${matchedVariantSize || "Std"}).`,
    performedBy,
  });
};

/**
 * Deduct inventory when a replacement garment is dispatched for an exchange
 */
export const deductExchangeReplacement = async (params: {
  ticketNumber: string;
  orderNumber?: string;
  originalItemDetails?: string;
  replacementItemDetails: string;
  quantity?: number;
  performedBy?: string;
  notes?: string;
}): Promise<void> => {
  const {
    ticketNumber,
    orderNumber,
    originalItemDetails,
    replacementItemDetails,
    quantity = 1,
    performedBy = "Exchange Dispatch Desk",
    notes,
  } = params;
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));

  // 1. Try matching replacementItemDetails directly to a catalog product
  let matchedProduct: ProductItem | null = await findProductByQueryOrId(replacementItemDetails);

  // 2. If replacementItemDetails only specified size/color (e.g. "Size 42" or "L"), resolve base product from originalItemDetails or order
  if (!matchedProduct && originalItemDetails) {
    matchedProduct = await findProductByQueryOrId(originalItemDetails);
  }

  if (!matchedProduct && orderNumber) {
    try {
      const order = await fetchOrderDocumentSafe(orderNumber);
      if (order && order.items && order.items.length > 0) {
        matchedProduct = await findProductByQueryOrId(String(order.items[0].id));
        if (!matchedProduct && order.items[0].name) {
          matchedProduct = await findProductByQueryOrId(order.items[0].name);
        }
      }
    } catch (orderErr) {
      console.warn("Could not inspect order for exchange deduction:", orderErr);
    }
  }

  if (!matchedProduct) {
    console.warn(
      `Could not locate product for exchange dispatch details: "${replacementItemDetails}" (orig: "${originalItemDetails}")`
    );
    return;
  }

  const productWithVars = ensureProductHasVariants(matchedProduct);
  const previousTotalStock = Number(productWithVars.stockCount) || 0;

  // Extract replacement target size & color from replacementItemDetails
  const parsed = extractSizeAndColor(replacementItemDetails, productWithVars.variants);
  const targetSize = parsed.size;
  const targetColor = parsed.color;

  let matchedVariantId: string | undefined;
  let matchedVariantSku: string | undefined;
  let matchedVariantColor = targetColor;
  let matchedVariantSize = targetSize;
  let prevVariantStock = 0;
  let newVariantStock = 0;

  let updatedVariants = productWithVars.variants ? [...productWithVars.variants] : [];

  if (updatedVariants.length > 0) {
    const varIdx = findMatchingVariantIndex(updatedVariants, targetSize, targetColor);
    if (varIdx >= 0) {
      const v = updatedVariants[varIdx];
      matchedVariantId = v.id;
      matchedVariantSku = v.sku;
      matchedVariantColor = v.color;
      matchedVariantSize = v.size;
      prevVariantStock = Number(v.stockCount) || 0;
      newVariantStock = Math.max(0, prevVariantStock - qty);

      updatedVariants[varIdx] = {
        ...v,
        stockCount: newVariantStock,
        inStock: newVariantStock > 0,
      };
    }
  }

  const newTotalStock =
    updatedVariants.length > 0
      ? updatedVariants.reduce((sum, item) => sum + (Number(item.stockCount) || 0), 0)
      : Math.max(0, previousTotalStock - qty);

  const updatedProduct: ProductItem = {
    ...productWithVars,
    variants: updatedVariants.length > 0 ? updatedVariants : undefined,
    stockCount: newTotalStock,
    inStock: newTotalStock > 0,
  };

  await saveProductToFirestore(updatedProduct);

  await recordStockMovement({
    productId: String(productWithVars.id),
    productName: productWithVars.name,
    productImage: productWithVars.images?.[0] || "",
    variantId: matchedVariantId,
    variantSku: matchedVariantSku,
    variantColor: matchedVariantColor,
    variantSize: matchedVariantSize,
    type: "exchange_dispatch",
    quantityDelta: -qty,
    previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
    newStock: matchedVariantId ? newVariantStock : newTotalStock,
    referenceId: ticketNumber,
    note:
      notes ||
      `Exchange Ticket #${ticketNumber} replacement dispatched: ${replacementItemDetails} (${matchedVariantColor || "Default"} / ${matchedVariantSize || "Standard"}).`,
    performedBy,
  });
};

/**
 * Record initial stock upon new product creation
 */
export const recordInitialProductStock = async (
  product: ProductItem,
  performedBy: string = "Admin Atelier Creator"
): Promise<void> => {
  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const stock = Number(v.stockCount) || 0;
      if (stock > 0) {
        await recordStockMovement({
          productId: product.id,
          productName: product.name,
          productImage: v.images?.[0] || product.images?.[0] || "",
          variantId: v.id,
          variantSku: v.sku,
          variantColor: v.color,
          variantSize: v.size,
          type: "initial",
          quantityDelta: stock,
          previousStock: 0,
          newStock: stock,
          note: `Initial stock intake for new garment creation: ${v.color} / ${v.size} (${stock} pcs).`,
          performedBy,
        });
      }
    }
  } else {
    const total = Number(product.stockCount) || 0;
    if (total > 0) {
      await recordStockMovement({
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || "",
        type: "initial",
        quantityDelta: total,
        previousStock: 0,
        newStock: total,
        note: `Initial stock intake for new product creation (${total} pcs).`,
        performedBy,
      });
    }
  }
};

/**
 * Initialize baseline movements from catalog products if movement ledger is completely empty
 */
export const initializeCatalogStockLedgerIfEmpty = async (
  products: ProductItem[]
): Promise<StockMovement[]> => {
  const existing = await fetchStockMovements(undefined, 10);
  if (existing.length > 0) return existing;

  const initialMovements: StockMovement[] = [];
  const now = Date.now();

  products.slice(0, 15).forEach((p, idx) => {
    const time = new Date(now - (idx * 3600000 * 3)).toISOString();
    if (p.variants && p.variants.length > 0) {
      p.variants.slice(0, 2).forEach((v) => {
        const stock = Number(v.stockCount) || 12;
        initialMovements.push({
          id: `mov_init_${p.id}_${v.id}`,
          productId: p.id,
          productName: p.name,
          productImage: v.images?.[0] || p.images?.[0] || "",
          variantId: v.id,
          variantSku: v.sku,
          variantColor: v.color,
          variantSize: v.size,
          type: "initial",
          quantityDelta: stock,
          previousStock: 0,
          newStock: stock,
          note: `Baseline catalog stock intake: ${p.name} (${v.color}/${v.size})`,
          performedBy: "Atelier Inventory Setup",
          createdAt: time,
        });
      });
    } else {
      const stock = Number(p.stockCount) || 20;
      initialMovements.push({
        id: `mov_init_${p.id}`,
        productId: p.id,
        productName: p.name,
        productImage: p.images?.[0] || "",
        type: "initial",
        quantityDelta: stock,
        previousStock: 0,
        newStock: stock,
        note: `Baseline catalog stock intake: ${p.name}`,
        performedBy: "Atelier Inventory Setup",
        createdAt: time,
      });
    }
  });

  if (initialMovements.length > 0) {
    saveLocalMovements(initialMovements);
  }
  return initialMovements;
};
