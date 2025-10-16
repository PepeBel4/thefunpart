export type OrderScenario = 'takeaway' | 'delivery' | 'eatin';
export type OrderTargetTimeType = 'asap' | 'scheduled';

export interface RestaurantPhoto {
  id: number;
  url: string;
}

export interface Chain {
  id: number;
  name: string;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  photos?: RestaurantPhoto[];
  photo_urls?: string[];
  chain_id?: number | null;
  chain?: Chain | null;
  cuisines?: string[];
}

export interface RestaurantUpdateInput {
  name?: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  chain_id?: number | null;
  cuisines?: string[];
}

export interface RestaurantCreateInput {
  name: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  chain_id?: number | null;
  cuisines?: string[];
}

export interface CardTransaction {
  id: number;
  entry_type: string;
  loyalty_points_delta: number;
  credit_cents_delta: number;
  loyalty_points_balance: number;
  credit_cents_balance: number;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  loyalty_points: number;
  credit_cents: number;
  restaurant_id?: number | null;
  chain_id?: number | null;
  restaurant?: Pick<Restaurant, 'id' | 'name'> | null;
  chain?: Chain | null;
  created_at: string;
  updated_at: string;
  transactions?: CardTransaction[];
}

export interface Allergen {
  id: number;
  name?: string;
  name_translations?: Record<string, string>;
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
  discounted_price_cents?: number | null;
  is_highlighted?: boolean | null;
  description?: string;
  categories?: MenuItemCategory[];
  allergens?: Allergen[];
  photos?: RestaurantPhoto[];
}

export interface MenuOptionCategory {
  id: number;
  restaurant_id: number;
  name_translations: Record<string, string>;
}

export interface MenuOptionMenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  price_cents: number;
  is_available: boolean;
}

export interface MenuOptionItem {
  id: number;
  title: string;
  name?: string;
  price_cents?: number | null;
  max_quantity?: number | null;
}

export interface MenuOption {
  id: number;
  title: string;
  category_id?: number | null;
  min_selections?: number | null;
  max_selections?: number | null;
  menu_item_ids?: number[];
  menu_items?: MenuOptionMenuItem[];
  option_items?: MenuOptionItem[];
  available_menu_items?: MenuOptionMenuItem[];
  category?: MenuOptionCategory | null;
  description?: string | null;
  price_cents?: number | null;
  name?: string;
  restaurant_id?: number | null;
}

export interface AiSuggestedMenuItem {
  id: number;
  name: string;
  price_cents: number;
  discounted_price_cents?: number | null;
  description?: string | null;
  reason?: string | null;
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price_cents: number;
  menu_item_categories?: Pick<MenuItemCategory, 'id' | 'name'>[];
  allergen_ids?: number[];
}

export interface MenuItemDiscountMenuItem {
  id: number;
  name: string;
  restaurant_id: number;
}

export interface MenuItemDiscount {
  id: number;
  discount_type: string;
  amount_cents?: number | null;
  percentage_value?: number | null;
  duration_type?: string | null;
  applies_to?: string | null;
  day_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  active?: boolean | null;
  menu_item_ids: number[];
  menu_items: MenuItemDiscountMenuItem[];
}

export interface MenuItemDiscountInput {
  discount_type: string;
  amount_cents?: number | null;
  percentage_value?: number | null;
  duration_type?: string | null;
  applies_to?: string | null;
  day_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  active?: boolean | null;
  menu_item_ids?: number[];
}

export interface MenuItemDiscountAssignment {
  id: number;
  menu_item_id: number;
  menu_item_discount_id: number;
  menu_item: MenuItemDiscountMenuItem;
  menu_item_discount: Pick<MenuItemDiscount, 'id' | 'discount_type' | 'duration_type' | 'applies_to'>;
}

export interface MenuItemDiscountAssignmentInput {
  menu_item_id: number;
  menu_item_discount_id: number;
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
  state?: 'composing' | 'sent' | string;
  payment_state?: string;
  paid_cents?: number;
  remaining_balance_cents?: number;
  order_items: OrderItem[];
  scenario?: OrderScenario;
  target_time_type?: OrderTargetTimeType;
  target_time_at?: string | null;
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
  order: Pick<Order, 'id' | 'payment_state' | 'paid_cents' | 'remaining_balance_cents' | 'state'>;
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