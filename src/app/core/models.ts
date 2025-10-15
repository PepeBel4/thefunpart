export type OrderScenario = 'takeaway' | 'delivery' | 'eatin';
export type OrderTargetTimeType = 'asap' | 'scheduled';

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
  photos?: RestaurantPhoto[];
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price_cents: number;
  menu_item_categories?: Pick<MenuItemCategory, 'id' | 'name'>[];
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
  payment_state?: string;
  paid_cents?: number;
  remaining_balance_cents?: number;
  order_items: OrderItem[];
  scenario?: OrderScenario;
  target_time_type?: OrderTargetTimeType;
  target_time?: string | null;
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

export interface Payment {
  id: number;
  amount_cents: number;
  status: string;
  provider: string;
  provider_payment_id: string;
  checkout_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderPaymentResponse {
  payment: Payment;
  order: Pick<Order, 'id' | 'payment_state' | 'paid_cents' | 'remaining_balance_cents'>;
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

export interface SessionUser {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  birthDate?: string | null;
}

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  birthDate: string | null;
}

export interface UserProfileInput {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
}