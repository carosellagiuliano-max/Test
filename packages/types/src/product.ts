import { BaseEntity, Status, UUID } from './common';

export interface Product extends BaseEntity {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price_cents: number;
  cost_cents?: number;
  category_id?: UUID;
  brand?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  status: Status;
  image_urls: string[];
  weight_grams?: number;
  dimensions?: ProductDimensions;
  tags: string[];
}

export interface ProductDimensions {
  length_cm: number;
  width_cm: number;
  height_cm: number;
}

export interface ProductCategory extends BaseEntity {
  name: string;
  description?: string;
  parent_id?: UUID;
  sort_order: number;
  status: Status;
}

export interface Order extends BaseEntity {
  customer_id: UUID;
  staff_id?: UUID;
  status: OrderStatus;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  payment_status: string; // Use string to avoid type conflict
  notes?: string;
  fulfillment_status: FulfillmentStatus;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
}

export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned';

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  product_snapshot?: Partial<Product>;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  price_cents: number;
  cost_cents?: number;
  category_id?: UUID;
  brand?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  image_urls?: string[];
  weight_grams?: number;
  dimensions?: ProductDimensions;
  tags?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price_cents?: number;
  cost_cents?: number;
  category_id?: UUID;
  brand?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  status?: Status;
  image_urls?: string[];
  weight_grams?: number;
  dimensions?: ProductDimensions;
  tags?: string[];
}