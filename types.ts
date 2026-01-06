
export interface StockItem {
  id: string;
  barcode: string;
  productName: string;
  expirationDate: string;
  category: string;
  quantity: number;
  location: string;
  createdAt: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStock: number;
  expiringSoon: number;
  totalValueEstimate?: number;
}
