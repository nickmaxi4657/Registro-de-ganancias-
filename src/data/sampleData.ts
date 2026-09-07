import { AppSettings, ProductPreset, Sale } from '../types';
import { calculateSaleMetrics } from '../utils/calculations';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: '$',
  defaultReinvestmentPercent: 40,
  businessName: 'Mi Negocio',
};

export const INITIAL_PRESETS: ProductPreset[] = [
  {
    id: 'preset-1',
    name: 'Remera Algodón Estampada',
    unitCost: 7500,
    unitPrice: 16000,
    category: 'Indumentaria',
    reinvestmentPercent: 40,
  },
  {
    id: 'preset-2',
    name: 'Zapatillas Urbanas',
    unitCost: 22000,
    unitPrice: 48000,
    category: 'Calzado',
    reinvestmentPercent: 35,
  },
  {
    id: 'preset-3',
    name: 'Funda Silicona Antigolpe',
    unitCost: 2400,
    unitPrice: 6500,
    category: 'Accesorios',
    reinvestmentPercent: 50,
  },
  {
    id: 'preset-4',
    name: 'Buzo Hoodie Frisa',
    unitCost: 16500,
    unitPrice: 35000,
    category: 'Indumentaria',
    reinvestmentPercent: 40,
  },
  {
    id: 'preset-5',
    name: 'Servicio Mantenimiento / Asesoría',
    unitCost: 5000,
    unitPrice: 28000,
    category: 'Servicios',
    reinvestmentPercent: 30,
  },
];

export function generateSampleSales(): Sale[] {
  const now = new Date();
  
  const rawSales = [
    {
      productName: 'Remera Algodón Estampada',
      unitCost: 7500,
      unitPrice: 16000,
      quantity: 2,
      reinvestmentPercent: 40,
      category: 'Indumentaria',
      paymentMethod: 'Transferencia',
      dateOffsetDays: 0,
      notes: 'Cliente regular, talle L y M',
    },
    {
      productName: 'Zapatillas Urbanas',
      unitCost: 22000,
      unitPrice: 48000,
      quantity: 1,
      reinvestmentPercent: 35,
      category: 'Calzado',
      paymentMethod: 'Tarjeta de Débito',
      dateOffsetDays: 1,
      notes: 'Color negro, modelo 2026',
    },
    {
      productName: 'Funda Silicona Antigolpe',
      unitCost: 2400,
      unitPrice: 6500,
      quantity: 3,
      reinvestmentPercent: 50,
      category: 'Accesorios',
      paymentMethod: 'Efectivo',
      dateOffsetDays: 2,
      notes: 'Venta combinada 3 modelos',
    },
    {
      productName: 'Buzo Hoodie Frisa',
      unitCost: 16500,
      unitPrice: 35000,
      quantity: 1,
      reinvestmentPercent: 40,
      category: 'Indumentaria',
      paymentMethod: 'Mercado Pago',
      dateOffsetDays: 3,
      notes: 'Envío incluido pactado con cliente',
    },
  ];

  return rawSales.map((item, index) => {
    const saleDate = new Date(now.getTime() - item.dateOffsetDays * 24 * 60 * 60 * 1000);
    const metrics = calculateSaleMetrics(
      item.unitCost,
      item.unitPrice,
      item.quantity,
      item.reinvestmentPercent
    );

    return {
      id: `sale-${Date.now()}-${index + 1}`,
      productName: item.productName,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      reinvestmentPercent: item.reinvestmentPercent,
      category: item.category,
      paymentMethod: item.paymentMethod,
      notes: item.notes,
      date: saleDate.toISOString(),
      ...metrics,
    };
  });
}
