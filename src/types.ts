/**
 * Types and interfaces for Aura Science Skincare Personalization applet
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  activeIngredient: string;
  price: number;
  image: string;
  stepName?: string;
  skinConcern: string;
}

export interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: Date;
  isAnalyzing?: boolean;
}

export interface SkinProfile {
  id: string;
  skinType?: string;
  concerns: string[];
  hydrationLevel?: number;
  elasticityIndex?: string;
  phRecommended?: string;
  keyIngredientNeeded?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutForm {
  fullName: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

export interface UserSession {
  hasActiveSession: boolean;
  skinProfile?: SkinProfile;
  messages: Message[];
  cart: CartItem[];
  savedRecs?: {
    email: string;
    products: Product[];
    profile: SkinProfile;
  };
}
