export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  photo_urls?: string[];
}

export interface MenuItemCategory {
  id?: number;
  name: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  price_cents: number; // integer cents from Rails
  description?: string;
  categories?: MenuItemCategory[];
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price_cents: number;
}

export interface OrderItemInput {
  menu_item_id: number;
  quantity: number;
  category?: string | null;
}

export interface Order {
  id: number;
  total_cents: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | string;
  order_items: OrderItem[];
  restaurant?: {
    id: number;
    name: string;
    address?: string;
  };
  user?: {
    id: number;
    email: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price_cents: number;
  menu_item?: {
    id: number;
    name: string;
    price_cents: number;
  };
  category?: string | null;
}

export interface SessionUser { id: number; email: string; }