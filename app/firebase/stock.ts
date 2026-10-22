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
}): Promise<{ success: boolean; newStock: number }> => {
  const { productId, variantId, quantityToAdd, note, performedBy = "Admin Atelier Desk" } = params;

  if (quantityToAdd <= 0) {
    throw new Error("Restock quantity must be greater than zero.");
  }

  let product = await fetchProductByIdFromFirestore(productId);
  if (!product) {
    const all = await fetchProductsFromFirestore();
    product = all.find((p) => p.id === productId) || null;
  }

  if (!product) {
    throw new Error(`Product with ID "${productId}" not found.`);
  }

  const previousTotalStock = product.stockCount ?? 0;
  let newTotalStock = previousTotalStock;
  let variantColor = "";
  let variantSize = "";
  let variantSku = "";
  let prevVariantStock = 0;
  let newVariantStock = 0;

  let updatedVariants = product.variants ? [...product.variants] : [];

  if (variantId && updatedVariants.length > 0) {
    const varIdx = updatedVariants.findIndex((v) => v.id === variantId);
    if (varIdx >= 0) {
      const v = updatedVariants[varIdx];
      prevVariantStock = Number(v.stockCount) || 0;
      newVariantStock = prevVariantStock + quantityToAdd;
      variantColor = v.color;
      variantSize = v.size;
      variantSku = v.sku || "";

      updatedVariants[varIdx] = {
        ...v,
        stockCount: newVariantStock,
        inStock: newVariantStock > 0,
      };

      // Recalculate total product stock as sum of variants
      newTotalStock = updatedVariants.reduce((sum, item) => sum + (Number(item.stockCount) || 0), 0);
    } else {
      newTotalStock = previousTotalStock + quantityToAdd;
    }
  } else {
    newTotalStock = previousTotalStock + quantityToAdd;
    // If product has variants, distribute proportionally or mark them
    if (updatedVariants.length > 0) {
      const perVar = Math.floor(quantityToAdd / updatedVariants.length);
      const remainder = quantityToAdd % updatedVariants.length;
      updatedVariants = updatedVariants.map((v, i) => {
        const added = perVar + (i === 0 ? remainder : 0);
        const next = (Number(v.stockCount) || 0) + added;
        return {
          ...v,
          stockCount: next,
          inStock: next > 0,
        };
      });
    }
  }

  const updatedProduct: ProductItem = {
    ...product,
    variants: updatedVariants.length > 0 ? updatedVariants : undefined,
    stockCount: newTotalStock,
    inStock: newTotalStock > 0,
  };

  await saveProductToFirestore(updatedProduct);

  // Record ledger movement
  await recordStockMovement({
    productId: product.id,
    productName: product.name,
    productImage: product.images?.[0] || "",
    variantId,
    variantSku,
    variantColor,
    variantSize,
    type: "restock",
    quantityDelta: quantityToAdd,
    previousStock: variantId ? prevVariantStock : previousTotalStock,
    newStock: variantId ? newVariantStock : newTotalStock,
    note: note || `Restocked +${quantityToAdd} units at Atelier Hub.`,
    performedBy,
  });

  return { success: true, newStock: newTotalStock };
};

/**
 * Automatically deduct inventory when a customer places an order
 */
export const deductStockForOrder = async (order: Order): Promise<void> => {
  if (!order || !order.items || order.items.length === 0) return;

  for (const item of order.items) {
    try {
      const productId = String(item.id);
      let product = await fetchProductByIdFromFirestore(productId);
      if (!product) {
        const all = await fetchProductsFromFirestore();
        product = all.find((p) => p.id === productId || p.name.toLowerCase() === item.name.toLowerCase()) || null;
      }

      if (!product) {
        console.warn(`Product ${item.name} (${productId}) not found for stock deduction.`);
        continue;
      }

      const qtyToDeduct = Number(item.quantity) || 1;
      const previousTotalStock = product.stockCount ?? 0;
      let newTotalStock = Math.max(0, previousTotalStock - qtyToDeduct);

      let matchedVariantId: string | undefined;
      let matchedVariantSku: string | undefined;
      let prevVariantStock = 0;
      let newVariantStock = 0;

      let updatedVariants = product.variants ? [...product.variants] : [];

      if (updatedVariants.length > 0) {
        // Find variant matching size and/or color
        const cleanSize = (item.size || "").trim().toLowerCase();
        const cleanColor = (item.color || "").trim().toLowerCase();

        const varIdx = updatedVariants.findIndex((v) => {
          const matchSize = !cleanSize || v.size.trim().toLowerCase() === cleanSize;
          const matchColor = !cleanColor || cleanColor === "default" || v.color.trim().toLowerCase() === cleanColor;
          return matchSize && matchColor;
        });

        if (varIdx >= 0) {
          const targetVariant = updatedVariants[varIdx];
          matchedVariantId = targetVariant.id;
          matchedVariantSku = targetVariant.sku;
          prevVariantStock = Number(targetVariant.stockCount) || 0;
          newVariantStock = Math.max(0, prevVariantStock - qtyToDeduct);

          updatedVariants[varIdx] = {
            ...targetVariant,
            stockCount: newVariantStock,
            inStock: newVariantStock > 0,
          };

          newTotalStock = updatedVariants.reduce((sum, v) => sum + (Number(v.stockCount) || 0), 0);
        }
      }

      const updatedProduct: ProductItem = {
        ...product,
        variants: updatedVariants.length > 0 ? updatedVariants : undefined,
        stockCount: newTotalStock,
        inStock: newTotalStock > 0,
      };

      await saveProductToFirestore(updatedProduct);

      // Record sale movement in ledger
      await recordStockMovement({
        productId: product.id,
        productName: product.name,
        productImage: item.image || product.images?.[0] || "",
        variantId: matchedVariantId,
        variantSku: matchedVariantSku,
        variantColor: item.color,
        variantSize: item.size,
        type: "sale",
        quantityDelta: -qtyToDeduct,
        previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
        newStock: matchedVariantId ? newVariantStock : newTotalStock,
        referenceId: order.orderNumber,
        note: `Sold via Order #${order.orderNumber} to ${order.customerName}`,
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
      let product = await fetchProductByIdFromFirestore(productId);
      if (!product) {
        const all = await fetchProductsFromFirestore();
        product = all.find((p) => p.id === productId || p.name.toLowerCase() === item.name.toLowerCase()) || null;
      }

      if (!product) continue;

      const qtyToRestore = Number(item.quantity) || 1;
      const previousTotalStock = product.stockCount ?? 0;
      let newTotalStock = previousTotalStock + qtyToRestore;

      let matchedVariantId: string | undefined;
      let matchedVariantSku: string | undefined;
      let prevVariantStock = 0;
      let newVariantStock = 0;

      let updatedVariants = product.variants ? [...product.variants] : [];

      if (updatedVariants.length > 0) {
        const cleanSize = (item.size || "").trim().toLowerCase();
        const cleanColor = (item.color || "").trim().toLowerCase();

        const varIdx = updatedVariants.findIndex((v) => {
          const matchSize = !cleanSize || v.size.trim().toLowerCase() === cleanSize;
          const matchColor = !cleanColor || cleanColor === "default" || v.color.trim().toLowerCase() === cleanColor;
          return matchSize && matchColor;
        });

        if (varIdx >= 0) {
          const targetVariant = updatedVariants[varIdx];
          matchedVariantId = targetVariant.id;
          matchedVariantSku = targetVariant.sku;
          prevVariantStock = Number(targetVariant.stockCount) || 0;
          newVariantStock = prevVariantStock + qtyToRestore;

          updatedVariants[varIdx] = {
            ...targetVariant,
            stockCount: newVariantStock,
            inStock: true,
          };

          newTotalStock = updatedVariants.reduce((sum, v) => sum + (Number(v.stockCount) || 0), 0);
        }
      }

      const updatedProduct: ProductItem = {
        ...product,
        variants: updatedVariants.length > 0 ? updatedVariants : undefined,
        stockCount: newTotalStock,
        inStock: true,
      };

      await saveProductToFirestore(updatedProduct);

      // Record cancel reversal movement
      await recordStockMovement({
        productId: product.id,
        productName: product.name,
        productImage: item.image || product.images?.[0] || "",
        variantId: matchedVariantId,
        variantSku: matchedVariantSku,
        variantColor: item.color,
        variantSize: item.size,
        type: "order_cancel",
        quantityDelta: qtyToRestore,
        previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
        newStock: matchedVariantId ? newVariantStock : newTotalStock,
        referenceId: order.orderNumber,
        note: `Order #${order.orderNumber} cancelled. Restored +${qtyToRestore} units. ${reason ? `(${reason})` : ""}`,
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
  const { ticketNumber, itemDetails, quantity = 1, performedBy = "Atelier Quality Audit", notes } = params;

  // Search product matching details
  const allProducts = await fetchProductsFromFirestore();
  const lowerDetails = itemDetails.toLowerCase();

  const matchedProduct = allProducts.find((p) =>
    lowerDetails.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lowerDetails.split("(")[0].trim())
  );

  if (!matchedProduct) {
    console.warn(`Could not automatically locate product for return details: "${itemDetails}"`);
    return;
  }

  let matchedVariantId: string | undefined;
  let matchedVariantSku: string | undefined;
  let prevVariantStock = 0;
  let newVariantStock = 0;
  const previousTotalStock = matchedProduct.stockCount ?? 0;
  let newTotalStock = previousTotalStock + quantity;

  let updatedVariants = matchedProduct.variants ? [...matchedProduct.variants] : [];

  if (updatedVariants.length > 0) {
    // Try to extract size from itemDetails, e.g. "Size: M" or "Size 32"
    const sizeMatch = lowerDetails.match(/size:?\s*([a-z0-9]+)/i);
    const targetSize = sizeMatch ? sizeMatch[1].trim().toLowerCase() : "";

    const varIdx = updatedVariants.findIndex((v) =>
      targetSize ? v.size.toLowerCase() === targetSize : true
    );

    if (varIdx >= 0) {
      const v = updatedVariants[varIdx];
      matchedVariantId = v.id;
      matchedVariantSku = v.sku;
      prevVariantStock = Number(v.stockCount) || 0;
      newVariantStock = prevVariantStock + quantity;

      updatedVariants[varIdx] = {
        ...v,
        stockCount: newVariantStock,
        inStock: true,
      };

      newTotalStock = updatedVariants.reduce((sum, item) => sum + (Number(item.stockCount) || 0), 0);
    }
  }

  const updatedProduct: ProductItem = {
    ...matchedProduct,
    variants: updatedVariants.length > 0 ? updatedVariants : undefined,
    stockCount: newTotalStock,
    inStock: true,
  };

  await saveProductToFirestore(updatedProduct);

  await recordStockMovement({
    productId: matchedProduct.id,
    productName: matchedProduct.name,
    productImage: matchedProduct.images?.[0] || "",
    variantId: matchedVariantId,
    variantSku: matchedVariantSku,
    type: "return_restock",
    quantityDelta: quantity,
    previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
    newStock: matchedVariantId ? newVariantStock : newTotalStock,
    referenceId: ticketNumber,
    note: notes || `Return Ticket #${ticketNumber} passed quality audit. Restored +${quantity} pristine garment to inventory.`,
    performedBy,
  });
};

/**
 * Deduct inventory when a replacement garment is dispatched for an exchange
 */
export const deductExchangeReplacement = async (params: {
  ticketNumber: string;
  orderNumber?: string;
  replacementItemDetails: string;
  quantity?: number;
  performedBy?: string;
}): Promise<void> => {
  const { ticketNumber, replacementItemDetails, quantity = 1, performedBy = "Exchange Dispatch Desk" } = params;

  const allProducts = await fetchProductsFromFirestore();
  const lowerDetails = replacementItemDetails.toLowerCase();

  const matchedProduct = allProducts.find((p) =>
    lowerDetails.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lowerDetails.split("-")[0].trim())
  );

  if (!matchedProduct) {
    console.warn(`Could not locate product for exchange dispatch details: "${replacementItemDetails}"`);
    return;
  }

  let matchedVariantId: string | undefined;
  let matchedVariantSku: string | undefined;
  let prevVariantStock = 0;
  let newVariantStock = 0;
  const previousTotalStock = matchedProduct.stockCount ?? 0;
  let newTotalStock = Math.max(0, previousTotalStock - quantity);

  let updatedVariants = matchedProduct.variants ? [...matchedProduct.variants] : [];

  if (updatedVariants.length > 0) {
    const sizeMatch = lowerDetails.match(/size:?\s*([a-z0-9]+)/i);
    const targetSize = sizeMatch ? sizeMatch[1].trim().toLowerCase() : "";

    const varIdx = updatedVariants.findIndex((v) =>
      targetSize ? v.size.toLowerCase() === targetSize : true
    );

    if (varIdx >= 0) {
      const v = updatedVariants[varIdx];
      matchedVariantId = v.id;
      matchedVariantSku = v.sku;
      prevVariantStock = Number(v.stockCount) || 0;
      newVariantStock = Math.max(0, prevVariantStock - quantity);

      updatedVariants[varIdx] = {
        ...v,
        stockCount: newVariantStock,
        inStock: newVariantStock > 0,
      };

      newTotalStock = updatedVariants.reduce((sum, item) => sum + (Number(item.stockCount) || 0), 0);
    }
  }

  const updatedProduct: ProductItem = {
    ...matchedProduct,
    variants: updatedVariants.length > 0 ? updatedVariants : undefined,
    stockCount: newTotalStock,
    inStock: newTotalStock > 0,
  };

  await saveProductToFirestore(updatedProduct);

  await recordStockMovement({
    productId: matchedProduct.id,
    productName: matchedProduct.name,
    productImage: matchedProduct.images?.[0] || "",
    variantId: matchedVariantId,
    variantSku: matchedVariantSku,
    type: "exchange_dispatch",
    quantityDelta: -quantity,
    previousStock: matchedVariantId ? prevVariantStock : previousTotalStock,
    newStock: matchedVariantId ? newVariantStock : newTotalStock,
    referenceId: ticketNumber,
    note: `Exchange Ticket #${ticketNumber} replacement dispatched: ${replacementItemDetails}.`,
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
