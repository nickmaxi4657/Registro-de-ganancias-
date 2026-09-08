export interface Sale {
  id: string;
  productName: string;
  unitCost: number; // Lo que me sale a mí
  unitPrice: number; // Lo que yo lo cobro
  quantity: number; // Cantidad vendida
  totalCost: number; // unitCost * quantity
  totalRevenue: number; // unitPrice * quantity
  netProfit: number; // totalRevenue - totalCost
  profitMargin: number; // (netProfit / totalRevenue) * 100
  markupPercent: number; // (netProfit / totalCost) * 100
  reinvestmentPercent: number; // % asignado a reinversión (ej. 40%)
  reinvestmentAmount: number; // Dinero de la ganancia destinado a reinvertir
  personalProfitAmount: number; // Dinero que me queda limpio a mí (bolsillo)
  totalBusinessRetention: number; // totalCost recuperado + reinvestmentAmount (capital para el negocio)
  date: string; // YYYY-MM-DDTHH:mm:ss
  category?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface ProductPreset {
  id: string;
  name: string;
  unitCost: number;
  unitPrice: number;
  category?: string;
  reinvestmentPercent?: number;
}

export interface AppSettings {
  currency: string;
  defaultReinvestmentPercent: number; // ej: 40%
  businessName: string;
}

export interface SummaryMetrics {
  totalSalesCount: number;
  totalUnitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalNetProfit: number;
  totalReinvestmentFund: number;
  totalPersonalProfit: number;
  totalBusinessWorkingCapital: number;
  averageProfitMargin: number;
}

export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}
