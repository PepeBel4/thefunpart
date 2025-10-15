export interface RestaurantPhoto {
  id: number;
  url: string;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  photos?: RestaurantPhoto[];
  photo_urls?: string[];
}

export interface RestaurantUpdateInput {
  name: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
}

export interface MenuItemCategory {
  id?: number;
  name?: string;
  name_translations?: Record<string, string>;
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
  category_id?: number | null;
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
  category_id?: number | null;
  category?: string | null;
}

export interface SessionUser { id: number; email: string; }