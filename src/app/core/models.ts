export interface Restaurant {
  id: number;
  name: string;
  description?: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  price_cents: number; // integer cents from Rails
  description?: string;
}

export interface OrderItemInput { menu_item_id: number; quantity: number; }

export interface Order {
  id: number;
  total_cents: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | string;
  items: { id: number; menu_item_id: number; quantity: number; price_cents: number; }[];
  created_at: string;
}

export interface SessionUser { id: number; email: string; }