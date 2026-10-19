import React, { useState, useRef } from "react";
import {
  XMarkIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  TagIcon,
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { Order, StoreGeneralSettings } from "~/firebase";
import { defaultStoreSettings } from "~/firebase";

interface OrderPackagingStickerModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  storeSettings?: StoreGeneralSettings;
}

// ---------------------------------------------------------------------------
// Standard Code 128 Barcode Generator (Pure TypeScript Vector SVG)
// ---------------------------------------------------------------------------
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

function generateCode128SvgBars(text: string): { totalWidth: number; bars: { x: number; width: number }[] } {
  // Start B
  const codes: number[] = [104];
  let sum = 104;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    const safeCode = code >= 0 && code <= 95 ? code : 0;
    codes.push(safeCode);
    sum += safeCode * (i + 1);
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(106); // Stop symbol

  let patternStr = "";
  for (const c of codes) {
    patternStr += CODE128_PATTERNS[c] || "";
  }

  const bars: { x: number; width: number }[] = [];
  let isBar = true;
  let x = 0;
  for (const digit of patternStr) {
    const width = parseInt(digit, 10) || 1;
    if (isBar) {
      bars.push({ x, width });
    }
    x += width;
    isBar = !isBar;
  }
  return { totalWidth: x, bars };
}

export const OrderPackagingStickerModal: React.FC<OrderPackagingStickerModalProps> = ({
  order,
  isOpen,
  onClose,
  storeSettings = defaultStoreSettings,
}) => {
  const [labelSize, setLabelSize] = useState<"4x6" | "a6" | "a4">("4x6");
  const [includeFragileNotice, setIncludeFragileNotice] = useState(true);
  const [includePriceDetails, setIncludePriceDetails] = useState(true);
  const [customPackingNote, setCustomPackingNote] = useState("");
  const [copied, setCopied] = useState(false);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  if (!order) return null;

  // Resolve barcode string (Tracking code preferred, fallback to order number)
  const barcodeValue = (order.trackingNumber || order.orderNumber).replace(/[^A-Za-z0-9-_]/g, "").toUpperCase();
  const { totalWidth: barcodeWidth, bars: barcodeBars } = generateCode128SvgBars(barcodeValue);

  // Check if COD or Prepaid
  const isCod = order.paymentMethod === "cod" && order.paymentStatus !== "paid";
  const amountToCollect = isCod ? order.totalAmount : 0;

  // Format delivery date or creation date
  const orderDateFormatted = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Copy courier info formatted for BD courier merchant portals (Steadfast, Pathao, RedX)
  const handleCopyCourierInfo = () => {
    const text = [
      `ORDER INVOICE: #${order.orderNumber}`,
      `RECIPIENT NAME: ${order.shippingAddress.fullName || order.customerName}`,
      `PHONE: ${order.shippingAddress.phoneNumber || order.customerPhone}`,
      `ADDRESS: ${order.shippingAddress.streetAddress}, ${order.shippingAddress.city}, ${order.shippingAddress.district}${order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ""}`,
      `DISTRICT: ${order.shippingAddress.district || order.shippingAddress.city}`,
      `COURIER: ${order.courierName || "Standard Courier"}`,
      `TRACKING: ${order.trackingNumber || "N/A"}`,
      `COLLECTION AMOUNT (COD): ৳${isCod ? order.totalAmount : 0} (${isCod ? "CASH ON DELIVERY" : "PREPAID - ৳0"})`,
      `PARCEL ITEMS (${order.items.length}): ${order.items.map((i) => `${i.name} (Qty: ${i.quantity}${i.size ? `, Size: ${i.size}` : ""}${i.color ? `, Color: ${i.color}` : ""})`).join("; ")}`,
      order.shippingAddress.notes ? `CUSTOMER NOTE: ${order.shippingAddress.notes}` : "",
      customPackingNote ? `PACKAGING NOTE: ${customPackingNote}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Courier shipment details copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Build the self-contained printable HTML document
  const generatePrintableHtml = () => {
    const isThermal = labelSize === "4x6";
    const isA6 = labelSize === "a6";
    const pageSizeCss = isThermal
      ? "@page { size: 100mm 150mm; margin: 0; }"
      : isA6
      ? "@page { size: 105mm 148mm; margin: 0; }"
      : "@page { size: A4 portrait; margin: 10mm; }";

    // SVG Barcode string
    const svgBarsHtml = barcodeBars
      .map((b) => `<rect x="${b.x}" y="0" width="${b.width}" height="44" fill="#000000" />`)
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Shipping Sticker - ${order.orderNumber}</title>
  <style>
    ${pageSizeCss}
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.25;
    }
    .sticker-wrapper {
      width: ${isThermal ? "100mm" : isA6 ? "105mm" : "140mm"};
      min-height: ${isThermal ? "150mm" : isA6 ? "148mm" : "auto"};
      margin: ${labelSize === "a4" ? "0 auto" : "0"};
      padding: 3mm 4mm;
      border: 2px solid #000000;
      background: #ffffff;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #000000;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .brand-sub {
      font-size: 8px;
      color: #333333;
      margin: 1px 0 0 0;
    }
    .order-badge-box {
      text-align: right;
    }
    .order-num {
      font-size: 13px;
      font-weight: 900;
      font-family: monospace;
      margin: 0;
    }
    .order-date {
      font-size: 8px;
      color: #444444;
      margin: 1px 0 0 0;
    }
    .courier-strip {
      background: #000000;
      color: #ffffff;
      padding: 4px 6px;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .barcode-section {
      text-align: center;
      padding: 4px 0;
      border-bottom: 1.5px dashed #000000;
      margin-bottom: 5px;
    }
    .barcode-num {
      font-family: monospace;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2px;
      margin-top: 2px;
    }
    .recipient-box {
      border: 1.5px solid #000000;
      padding: 6px;
      margin-bottom: 5px;
      background: #fafafa;
    }
    .section-label {
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #222222;
      border-bottom: 1px solid #dddddd;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }
    .recipient-name {
      font-size: 14px;
      font-weight: 900;
      margin: 0 0 2px 0;
    }
    .recipient-phone {
      font-size: 13px;
      font-weight: 900;
      font-family: monospace;
      color: #000000;
      margin: 0 0 3px 0;
      background: #ffffff;
      display: inline-block;
      padding: 1px 4px;
      border: 1px solid #000000;
    }
    .recipient-address {
      font-size: 10.5px;
      font-weight: 600;
      color: #111111;
      margin: 0;
      line-height: 1.3;
    }
    .note-box {
      margin-top: 3px;
      padding: 3px;
      background: #ffffff;
      border: 1px dashed #000000;
      font-size: 9px;
      font-weight: bold;
    }
    .cod-box {
      border: 2.5px solid #000000;
      padding: 5px 6px;
      margin-bottom: 5px;
      text-align: center;
      ${isCod ? "background: #f4f4f4;" : "background: #ffffff;"}
    }
    .cod-title {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .cod-amount {
      font-size: 18px;
      font-weight: 900;
      margin: 1px 0;
      font-family: monospace;
    }
    .cod-subtext {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-bottom: 5px;
      border: 1px solid #cccccc;
    }
    .items-table th {
      background: #eeeeee;
      border-bottom: 1px solid #999999;
      padding: 3px 4px;
      text-align: left;
      font-size: 8px;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 2.5px 4px;
      border-bottom: 1px solid #eeeeee;
    }
    .items-summary-bar {
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      font-size: 9px;
      padding: 3px 4px;
      background: #f9f9f9;
      border: 1px solid #dddddd;
      margin-bottom: 5px;
    }
    .footer-badges {
      border-top: 1.5px solid #000000;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      font-weight: 800;
    }
    .return-address-bar {
      font-size: 7.5px;
      color: #333333;
      text-align: center;
      border-top: 1px dashed #999999;
      padding-top: 3px;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="sticker-wrapper">
    <!-- Header: Store Branding & Order Reference -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <h1 class="brand-title">${storeSettings.storeName || "FEDOLL ATELIER"}</h1>
          <p class="brand-sub">${storeSettings.tagline || "Luxury Modest & Contemporary Garments"}</p>
          <p class="brand-sub" style="font-weight: bold; margin-top: 1px;">Help: ${storeSettings.contactPhone || "+880 1712-345678"}</p>
        </td>
        <td class="order-badge-box" style="vertical-align: top;">
          <p class="order-num">#${order.orderNumber}</p>
          <p class="order-date">Order: ${orderDateFormatted}</p>
          <p class="order-date">Packed: ${todayFormatted}</p>
        </td>
      </tr>
    </table>

    <!-- Courier Partner Strip -->
    <div class="courier-strip">
      <span>COURIER: ${(order.courierName || "STEADFAST COURIER").toUpperCase()}</span>
      <span>DEST: ${(order.shippingAddress.district || order.shippingAddress.city || "DHAKA").toUpperCase()}</span>
    </div>

    <!-- Scannable Barcode -->
    <div class="barcode-section">
      <svg viewBox="0 0 ${barcodeWidth} 44" width="85%" height="38" style="display: block; margin: 0 auto;" preserveAspectRatio="none">
        ${svgBarsHtml}
      </svg>
      <div class="barcode-num">${barcodeValue}</div>
    </div>

    <!-- SHIP TO: Customer Details -->
    <div class="recipient-box">
      <div class="section-label">SHIP TO / RECIPIENT DETAILS</div>
      <div class="recipient-name">${order.shippingAddress.fullName || order.customerName}</div>
      <div class="recipient-phone">📞 ${order.shippingAddress.phoneNumber || order.customerPhone}</div>
      <div class="recipient-address">
        ${order.shippingAddress.streetAddress}, ${order.shippingAddress.city}, ${order.shippingAddress.district}${order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ""}
      </div>
      ${
        order.shippingAddress.notes
          ? `<div class="note-box">⚠ CUSTOMER NOTE: ${order.shippingAddress.notes}</div>`
          : ""
      }
      ${
        customPackingNote
          ? `<div class="note-box" style="border-color: #000;">★ PACKAGING NOTE: ${customPackingNote}</div>`
          : ""
      }
    </div>

    <!-- PAYMENT & COD COLLECTION BOX -->
    <div class="cod-box">
      ${
        isCod
          ? `
        <div class="cod-title">CASH ON DELIVERY (COD)</div>
        <div class="cod-amount">COLLECT: ৳${amountToCollect.toLocaleString()}</div>
        <div class="cod-subtext">Courier: Please collect exact amount before handover</div>
      `
          : `
        <div class="cod-title" style="color: #000;">PREPAID PARCEL • DO NOT COLLECT CASH</div>
        <div class="cod-amount" style="font-size: 15px;">৳ 0 (PAID VIA ${(order.paymentMethod || "ONLINE").toUpperCase()})</div>
        <div class="cod-subtext">Package is fully paid for. Zero cash collection required.</div>
      `
      }
    </div>

    <!-- PRODUCT MANIFEST (What is in this bag) -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="width: 45px; text-align: center;">Size</th>
          <th style="width: 45px; text-align: center;">Color</th>
          <th style="width: 30px; text-align: center;">Qty</th>
          ${includePriceDetails ? `<th style="width: 50px; text-align: right;">Total</th>` : ""}
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td style="text-align: center;">${item.size || "-"}</td>
            <td style="text-align: center;">${item.color || "-"}</td>
            <td style="text-align: center; font-weight: bold;">x${item.quantity}</td>
            ${
              includePriceDetails
                ? `<td style="text-align: right; font-family: monospace;">৳${(item.price * item.quantity).toLocaleString()}</td>`
                : ""
            }
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="items-summary-bar">
      <span>Total Garments: <strong>${order.totalQuantity || order.items.reduce((s, i) => s + i.quantity, 0)} pcs</strong></span>
      ${
        includePriceDetails
          ? `<span>Grand Total: <strong>৳${order.totalAmount.toLocaleString()}</strong></span>`
          : `<span>Manifest Verified [✓]</span>`
      }
    </div>

    <!-- Handling & Verification Badges -->
    ${
      includeFragileNotice
        ? `
      <div class="footer-badges">
        <span>FRAGILE / HANDLE WITH CARE</span>
        <span>KEEP DRY / NO MOISTURE</span>
        <span>GENUINE FEDOLL</span>
      </div>
    `
        : ""
    }

    <!-- Return Address -->
    <div class="return-address-bar">
      <strong>Return If Undelivered:</strong> ${storeSettings.headquartersAddress || "Dhaka, Bangladesh"} • Tel: ${storeSettings.contactPhone || "+880 1712-345678"}
    </div>
  </div>
</body>
</html>`;
  };

  // Trigger high-resolution printing via isolated hidden iframe
  const handlePrint = () => {
    try {
      const htmlContent = generatePrintableHtml();

      // Create or reuse hidden iframe
      let iframe = printIframeRef.current;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
        printIframeRef.current = iframe;
      }

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Give the iframe a brief moment to render images/fonts before calling print
        setTimeout(() => {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
          toast.success("Printing packaging sticker...");
        }, 300);
      } else {
        window.print();
      }
    } catch (err) {
      console.error("Failed to print sticker:", err);
      window.print();
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50 font-sans" onClose={onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
        </TransitionChild>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-stone-100 dark:bg-neutral-900 p-5 sm:p-7 text-left shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 text-gray-900 dark:text-white">
                {/* Modal Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
                      <TagIcon className="size-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white font-mono">
                          Parcel Shipping Sticker
                        </DialogTitle>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-mono">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Printable packing slip &amp; courier sticker to glue onto parcel bags or shipping cartons.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <PrinterIcon className="size-4" />
                      <span>Print Sticker</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white border border-stone-200 dark:border-neutral-800 hover:bg-stone-200/50 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
                  {/* Left Column: Sticker Controls & Customization */}
                  <div className="lg:col-span-4 space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 space-y-3 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white pb-2 border-b border-stone-100 dark:border-neutral-800">
                        <AdjustmentsHorizontalIcon className="size-4 text-orange-600" />
                        <span>Sticker Print Settings</span>
                      </div>

                      {/* Label Format */}
                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                          Target Paper / Sticker Size:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { key: "4x6", label: "4\" × 6\" Thermal", badge: "Standard" },
                            { key: "a6", label: "A6 Compact", badge: "Pocket" },
                            { key: "a4", label: "A4 Sheet", badge: "Full" },
                          ].map((fmt) => (
                            <button
                              key={fmt.key}
                              type="button"
                              onClick={() => setLabelSize(fmt.key as any)}
                              className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                                labelSize === fmt.key
                                  ? "border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-bold"
                                  : "border-stone-200 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-900 text-gray-600 dark:text-neutral-400 font-medium"
                              }`}
                            >
                              <div className="text-[11px] leading-tight">{fmt.label}</div>
                              <span className="text-[9px] opacity-70 block mt-0.5">{fmt.badge}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Options Toggles */}
                      <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeFragileNotice}
                            onChange={(e) => setIncludeFragileNotice(e.target.checked)}
                            className="size-4 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span className="font-semibold text-gray-700 dark:text-neutral-300">
                            Include "Fragile / Keep Dry" Badges
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includePriceDetails}
                            onChange={(e) => setIncludePriceDetails(e.target.checked)}
                            className="size-4 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span className="font-semibold text-gray-700 dark:text-neutral-300">
                            Show Garment Item Prices on Manifest
                          </span>
                        </label>
                      </div>

                      {/* Custom Rider / Packing Note */}
                      <div className="pt-1">
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Custom Packing / Rider Note (Optional):
                        </label>
                        <input
                          type="text"
                          value={customPackingNote}
                          onChange={(e) => setCustomPackingNote(e.target.value)}
                          placeholder="e.g. Call before delivery, Gift pack..."
                          className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-600"
                        />
                      </div>
                    </div>

                    {/* Quick Courier Copy Card */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                          <TruckIcon className="size-4 text-orange-600" />
                          <span>Courier Booking Helper</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {order.courierName || "Steadfast"}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed">
                        Need to paste these shipment details into Steadfast, Pathao, or RedX merchant dashboard?
                      </p>

                      <button
                        type="button"
                        onClick={handleCopyCourierInfo}
                        className="w-full py-2.5 px-3 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-200 font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <CheckIcon className="size-4 text-emerald-600" />
                            <span className="text-emerald-600">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <DocumentDuplicateIcon className="size-4 text-orange-600" />
                            <span>Copy for Courier Portal</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Print Action Card */}
                    <div className="p-4 rounded-2xl bg-orange-600 text-white space-y-3 shadow-md">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <SparklesIcon className="size-5" />
                        <span>Ready to Glue on Parcel</span>
                      </div>
                      <p className="text-xs text-orange-100 leading-relaxed">
                        Click below to open the print dialog. Works with any standard thermal label printer (Xprinter, Zebra, Rongta) or A4 sticker paper.
                      </p>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="w-full py-3 px-4 rounded-xl bg-white text-orange-700 hover:bg-orange-50 active:scale-98 font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <PrinterIcon className="size-4" />
                        <span>Print Shipping Sticker Now</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: High-Fidelity Sticker Live Preview */}
                  <div className="lg:col-span-8 flex flex-col items-center justify-center p-2 sm:p-4 bg-stone-200/60 dark:bg-neutral-950/80 rounded-2xl border border-stone-300 dark:border-neutral-800 overflow-x-auto">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-3 block">
                      Live Label Preview ({labelSize === "4x6" ? "4\" × 6\" Thermal" : labelSize.toUpperCase()})
                    </span>

                    {/* PHYSICAL STICKER CONTAINER */}
                    <div
                      className="w-full max-w-[420px] bg-white text-black p-4 rounded-xl shadow-2xl border-2 border-black font-sans text-left select-none relative"
                      style={{ minHeight: "560px" }}
                    >
                      {/* Store Header */}
                      <div className="flex items-start justify-between pb-2 border-b-2 border-black">
                        <div>
                          <h2 className="text-base font-black tracking-wider uppercase text-black leading-tight">
                            {storeSettings.storeName || "FEDOLL ATELIER"}
                          </h2>
                          <p className="text-[9px] text-gray-700 font-medium">
                            {storeSettings.tagline || "Luxury Modest & Contemporary Garments"}
                          </p>
                          <p className="text-[9px] font-bold text-black mt-0.5">
                            Customer Care: {storeSettings.contactPhone || "+880 1712-345678"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black font-mono text-black leading-none">
                            #{order.orderNumber}
                          </p>
                          <span className="text-[9px] text-gray-600 block mt-1 font-mono">
                            {orderDateFormatted}
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono">
                            Packed: {todayFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Courier & Zone Banner */}
                      <div className="bg-black text-white px-2.5 py-1.5 my-2 flex items-center justify-between font-black text-xs tracking-wider uppercase rounded-xs">
                        <span>COURIER: {order.courierName || "STEADFAST COURIER"}</span>
                        <span className="text-[10px] font-bold bg-white text-black px-1.5 py-0.2 rounded-xs">
                          {(order.shippingAddress.district || order.shippingAddress.city || "DHAKA").toUpperCase()}
                        </span>
                      </div>

                      {/* Barcode & Consignment */}
                      <div className="text-center py-1.5 border-b border-dashed border-black">
                        <svg
                          viewBox={`0 0 ${barcodeWidth} 44`}
                          className="w-3/4 h-9 mx-auto block"
                          preserveAspectRatio="none"
                        >
                          {barcodeBars.map((b, i) => (
                            <rect
                              key={i}
                              x={b.x}
                              y={0}
                              width={b.width}
                              height={44}
                              fill="#000000"
                            />
                          ))}
                        </svg>
                        <p className="text-xs font-mono font-black tracking-widest mt-1 text-black">
                          {barcodeValue}
                        </p>
                      </div>

                      {/* Recipient Details */}
                      <div className="border border-black p-2.5 my-2 bg-stone-50/50 rounded-xs">
                        <div className="text-[8px] font-black uppercase text-gray-600 tracking-wider pb-1 border-b border-gray-200">
                          SHIP TO / RECIPIENT DETAILS:
                        </div>
                        <h3 className="text-sm font-black text-black mt-1 leading-snug">
                          {order.shippingAddress.fullName || order.customerName}
                        </h3>
                        <div className="my-1">
                          <span className="text-xs font-mono font-black text-black border border-black px-2 py-0.5 bg-white inline-block">
                            📞 {order.shippingAddress.phoneNumber || order.customerPhone}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">
                          {order.shippingAddress.streetAddress}, {order.shippingAddress.city},{" "}
                          {order.shippingAddress.district}
                          {order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ""}
                        </p>
                        {order.shippingAddress.notes && (
                          <div className="mt-1.5 p-1 bg-white border border-dashed border-black text-[9px] font-bold text-black">
                            ⚠ CUSTOMER NOTE: {order.shippingAddress.notes}
                          </div>
                        )}
                        {customPackingNote && (
                          <div className="mt-1 p-1 bg-white border border-black text-[9px] font-bold text-black">
                            ★ PACKAGING NOTE: {customPackingNote}
                          </div>
                        )}
                      </div>

                      {/* COD / Payment Highlight Box */}
                      <div
                        className={`border-2 border-black p-2 text-center my-2 rounded-xs ${
                          isCod ? "bg-stone-100" : "bg-white"
                        }`}
                      >
                        {isCod ? (
                          <>
                            <div className="text-[10px] font-black uppercase tracking-wider text-black">
                              CASH ON DELIVERY (COD)
                            </div>
                            <div className="text-xl font-black font-mono text-black leading-tight my-0.5">
                              COLLECT: ৳{amountToCollect.toLocaleString()}
                            </div>
                            <div className="text-[8px] font-bold text-gray-700 uppercase">
                              Courier: Please collect exact amount before handover
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-[10px] font-black uppercase tracking-wider text-black">
                              PREPAID PARCEL • DO NOT COLLECT CASH
                            </div>
                            <div className="text-base font-black font-mono text-black leading-tight my-0.5">
                              ৳ 0 (PAID VIA {(order.paymentMethod || "ONLINE").toUpperCase()})
                            </div>
                            <div className="text-[8px] font-bold text-gray-700 uppercase">
                              Package is fully paid. Zero cash collection required.
                            </div>
                          </>
                        )}
                      </div>

                      {/* Package Contents Table */}
                      <div className="my-2 border border-gray-300 rounded-xs overflow-hidden">
                        <table className="w-full text-left text-[9px]">
                          <thead className="bg-gray-100 uppercase text-[8px] font-bold text-gray-700 border-b border-gray-300">
                            <tr>
                              <th className="py-1 px-1.5">Item Description</th>
                              <th className="py-1 px-1 text-center">Size</th>
                              <th className="py-1 px-1 text-center">Color</th>
                              <th className="py-1 px-1 text-center">Qty</th>
                              {includePriceDetails && (
                                <th className="py-1 px-1.5 text-right">Price</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {order.items.map((item, idx) => (
                              <tr key={idx} className="leading-tight">
                                <td className="py-1 px-1.5 font-bold text-black truncate max-w-[140px]">
                                  {item.name}
                                </td>
                                <td className="py-1 px-1 text-center font-semibold text-gray-700">
                                  {item.size || "-"}
                                </td>
                                <td className="py-1 px-1 text-center font-semibold text-gray-700">
                                  {item.color || "-"}
                                </td>
                                <td className="py-1 px-1 text-center font-black text-black">
                                  x{item.quantity}
                                </td>
                                {includePriceDetails && (
                                  <td className="py-1 px-1.5 text-right font-mono font-bold text-black">
                                    ৳{(item.price * item.quantity).toLocaleString()}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-black bg-stone-50 border border-gray-200 px-2 py-1 mb-2">
                        <span>
                          Total Garments: {order.totalQuantity || order.items.reduce((s, i) => s + i.quantity, 0)} pcs
                        </span>
                        {includePriceDetails ? (
                          <span>Grand Total: ৳{order.totalAmount.toLocaleString()}</span>
                        ) : (
                          <span>Manifest Verified [✓]</span>
                        )}
                      </div>

                      {/* Fragile & Safety Bar */}
                      {includeFragileNotice && (
                        <div className="flex items-center justify-between text-[8px] font-black border-t-2 border-black pt-1 uppercase">
                          <span>FRAGILE / HANDLE WITH CARE</span>
                          <span>KEEP AWAY FROM RAIN</span>
                          <span>GENUINE FEDOLL</span>
                        </div>
                      )}

                      {/* Sender Return Address Footer */}
                      <div className="text-[7.5px] text-center text-gray-600 border-t border-dashed border-gray-400 pt-1 mt-1 leading-tight">
                        <strong>Return If Undelivered:</strong> {storeSettings.headquartersAddress || "Sector 3, Uttara Model Town, Dhaka 1230, Bangladesh"} • Tel: {storeSettings.contactPhone || "+880 1712-345678"}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default OrderPackagingStickerModal;
