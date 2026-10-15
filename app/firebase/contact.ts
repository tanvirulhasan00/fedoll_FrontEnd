import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  category: string;
  orderNumber?: string;
  subject: string;
  message: string;
}

export interface ContactMessageRecord extends ContactMessagePayload {
  id?: string;
  status: "new" | "in-review" | "resolved";
  createdAt?: unknown;
  submittedAt: string;
}

export interface ContactChannel {
  id: string;
  title: string;
  description: string;
  contact: string;
  actionText: string;
  actionUrl: string;
  badge?: string;
  iconName: "PhoneIcon" | "EnvelopeIcon" | "ChatBubbleBottomCenterTextIcon" | "BuildingStorefrontIcon";
}

export interface ContactFAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ContactOfficeInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  whatsapp: string;
  hoursWeekday: string;
  hoursWeekend: string;
  googleMapsEmbedUrl: string;
  googleMapsUrl: string;
}

export interface ContactPageData {
  tagline: string;
  title: string;
  subtitle: string;
  heroImage: string;
  office: ContactOfficeInfo;
  channels: ContactChannel[];
  faqs: ContactFAQItem[];
}

export const initialContactData: ContactPageData = {
  tagline: "We're Here For You",
  title: "Get in Touch with Fedoll",
  subtitle:
    "Have questions about our garments, sizing, your existing order, or visiting our Dhaka studio? Our friendly support team is always ready to help.",
  heroImage:
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=80",
  office: {
    name: "Fedoll Design Studio & Flagship Showroom",
    tagline: "Banani, Dhaka",
    address: "House 18, Road 11, Block D, Banani",
    city: "Dhaka",
    country: "Bangladesh",
    postalCode: "1213",
    phone: "+880 1700-123456",
    email: "support@fedoll.com",
    whatsapp: "+880 1700-123456",
    hoursWeekday: "Saturday – Thursday: 10:00 AM – 08:00 PM (BST)",
    hoursWeekend: "Friday: 02:30 PM – 08:30 PM (BST)",
    googleMapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.0477174624403!2d90.4022839760237!3d23.781313087570414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c70b72a08271%3A0xb56306e00b730f81!2sRoad%2011%2C%20Dhaka%201213!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd",
    googleMapsUrl: "https://maps.google.com/?q=Banani+Road+11+Dhaka+Bangladesh",
  },
  channels: [
    {
      id: "customer-care",
      title: "Customer Support & Orders",
      description: "Direct assistance with orders, courier tracking, and payment verification.",
      contact: "+880 1700-123456",
      actionText: "Call Customer Care",
      actionUrl: "tel:+8801700123456",
      badge: "Fastest response",
      iconName: "PhoneIcon",
    },
    {
      id: "whatsapp",
      title: "WhatsApp Fast Chat",
      description: "Quick chat for size recommendations, fabric advice, and delivery updates.",
      contact: "+880 1700-123456",
      actionText: "Message on WhatsApp",
      actionUrl: "https://wa.me/8801700123456?text=Hi%20Fedoll%2C%20I%20have%20an%20inquiry%20regarding%20your%20products.",
      badge: "Instant messaging",
      iconName: "ChatBubbleBottomCenterTextIcon",
    },
    {
      id: "email-support",
      title: "Email Inquiries",
      description: "For detailed questions, bulk corporate gifts, and exchange requests.",
      contact: "support@fedoll.com",
      actionText: "Send an Email",
      actionUrl: "mailto:support@fedoll.com?subject=Inquiry%20from%20Fedoll%20Website",
      badge: "Within 2-4 hours",
      iconName: "EnvelopeIcon",
    },
    {
      id: "dhaka-studio",
      title: "Dhaka Studio Showroom",
      description: "Experience our selvedge denim, wool coats, and cotton shirts in person.",
      contact: "House 18, Road 11, Block D, Banani, Dhaka",
      actionText: "Get Studio Directions",
      actionUrl: "https://maps.google.com/?q=Banani+Road+11+Dhaka+Bangladesh",
      badge: "Open 7 Days",
      iconName: "BuildingStorefrontIcon",
    },
  ],
  faqs: [
    {
      id: "faq-1",
      category: "Shipping & Delivery",
      question: "How long does delivery take across Bangladesh?",
      answer:
        "Inside Dhaka metropolitan area, orders are typically delivered within 24 to 48 hours. For all other 63 districts across Bangladesh, standard courier delivery arrives within 2 to 4 business days right at your doorstep.",
    },
    {
      id: "faq-2",
      category: "Payments",
      question: "Can I pay using Cash on Delivery (COD) or bKash / Nagad?",
      answer:
        "Yes! We offer full Cash on Delivery (COD) across all 64 districts in Bangladesh. You can also pay via bKash, Nagad, Visa, Mastercard, or local bank transfer during checkout.",
    },
    {
      id: "faq-3",
      category: "Exchanges & Sizing",
      question: "What is your exchange and return policy?",
      answer:
        "We offer an easy 7-day exchange window. If the jacket, shirt, or pants you ordered don't fit perfectly, just message us on WhatsApp or fill out the contact form with your Order ID. We will arrange a size exchange with zero hassle.",
    },
    {
      id: "faq-4",
      category: "Showroom & Studio",
      question: "Can I visit your Banani studio to try on items before buying?",
      answer:
        "Absolutely. Our Banani studio showroom is open Saturday through Thursday from 10:00 AM to 8:00 PM, and Friday from 2:30 PM to 8:30 PM. You are welcome to try on any garment, feel our fabrics, and get styling tips from our in-house specialists.",
    },
    {
      id: "faq-5",
      category: "Wholesale & B2B",
      question: "Do you offer corporate gifting or wholesale orders?",
      answer:
        "Yes, we collaborate with corporate teams, creative agencies, and boutiques for premium apparel, custom embroidery, and bulk uniforms. Select 'Wholesale & B2B' in the form or email wholesale@fedoll.com.",
    },
  ],
};

/**
 * Submits a new customer inquiry to the Cloud Firestore 'contact_messages' collection
 */
export const submitContactMessageToFirestore = async (
  payload: ContactMessagePayload
): Promise<{ success: boolean; id: string; message: string }> => {
  if (!payload.name || !payload.name.trim()) {
    throw new Error("Please enter your name.");
  }

  if (!payload.email || !payload.email.trim()) {
    throw new Error("Please enter your email address.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email.trim())) {
    throw new Error("Please enter a valid email address.");
  }

  if (!payload.subject || !payload.subject.trim()) {
    throw new Error("Please enter a subject.");
  }

  if (!payload.message || !payload.message.trim()) {
    throw new Error("Please enter your message.");
  }

  const messagesRef = collection(db, "contact_messages");
  const docRef = await addDoc(messagesRef, {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || "",
    category: payload.category || "General Inquiry",
    orderNumber: payload.orderNumber?.trim() || "",
    subject: payload.subject.trim(),
    message: payload.message.trim(),
    status: "new",
    submittedAt: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });

  return {
    success: true,
    id: docRef.id,
    message: "Thank you for reaching out! Our team will get back to you shortly.",
  };
};

/**
 * Fetch Contact Us page data from Cloud Firestore with fallback to initialContactData
 */
export const fetchContactDataFromFirestore = async (): Promise<ContactPageData> => {
  try {
    const docRef = doc(db, "contact_page", "main");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as ContactPageData;
      return data;
    }

    // Seed initial data if document doesn't exist yet
    await seedContactDataToFirestore();
    return initialContactData;
  } catch (error) {
    console.warn("Failed to fetch contact data from Firestore, using initial dataset:", error);
    return initialContactData;
  }
};

/**
 * Seed or update Contact Us page data in Cloud Firestore
 */
export const seedContactDataToFirestore = async (force: boolean = false) => {
  const docRef = doc(db, "contact_page", "main");
  await setDoc(
    docRef,
    {
      ...initialContactData,
      updatedAt: serverTimestamp(),
    },
    { merge: !force }
  );

  return {
    success: true,
    message: "Contact Us page data successfully saved to Firebase Firestore!",
  };
};
