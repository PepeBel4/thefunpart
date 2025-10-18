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

export interface ReviewAuthor {
  id?: number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface Review {
  id: number;
  rating?: number | null;
  score?: number | null;
  value?: number | null;
  comment?: string | null;
  body?: string | null;
  text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user?: ReviewAuthor | null;
  author_name?: string | null;
  reviewer_name?: string | null;
}

export interface RatingInput {
  rateable_type: 'restaurant' | 'menu_item';
  rateable_id: number;
  score: number;
  comment?: string | null;
}

export interface RatingSummary {
  average_rating?: number | null;
  avg_rating?: number | null;
  rating?: number | null;
  value?: number | null;
  rating_count?: number;
  ratings_count?: number;
  total_ratings?: number;
  count?: number;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  photos?: RestaurantPhoto[];
  photo_urls?: string[];
  logo?: RestaurantPhoto | null;
  logo_url?: string | null;
  chain_id?: number | null;
  chain?: Chain | null;
  cuisines?: string[];
  primary_color?: string | null;
  locations?: Location[] | null;
  rating_summary?: RatingSummary | null;
  rating_average?: number | null;
  rating_count?: number | null;
  reviews?: Review[] | null;
  ratings?: Review[] | null;
}

export interface Location {
  id: number;
  locatable_type: string;
  locatable_id: number;
  name: string;
  location_type?: string | null;
  telephone_number?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
  opening_hours?: LocationOpeningHour[] | null;
  opening_hour_exceptions?: LocationOpeningHourException[] | null;
}

export interface LocationInput {
  name: string;
  location_type?: string | null;
  telephone_number?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationOpeningHour {
  id: number;
  location_id: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  created_at: string;
  updated_at: string;
}

export interface LocationOpeningHourInput {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
}

export interface LocationOpeningHourException {
  id: number;
  location_id: number;
  date: string;
  closed: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationOpeningHourExceptionInput {
  date: string;
  closed: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  reason?: string | null;
}

export interface RestaurantUpdateInput {
  name?: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  chain_id?: number | null;
  cuisines?: string[];
  primary_color?: string | null;
  logo_url?: string | null;
}

export interface RestaurantCreateInput {
  name: string;
  description?: string;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  chain_id?: number | null;
  cuisines?: string[];
  primary_color?: string | null;
  logo_url?: string | null;
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
  option_assignments?: MenuOptionAssignment[];
  rating_summary?: RatingSummary | null;
  rating_average?: number | null;
  rating_count?: number | null;
  reviews?: Review[] | null;
  ratings?: Review[] | null;
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

export interface MenuOptionAssignment {
  id: number;
  menu_item_option_id: number;
  menu_item_id: number;
  created_at: string;
  updated_at: string;
}

export interface MenuOptionAssignmentInput {
  menu_item_option_id: number;
  menu_item_id: number;
}

export interface MenuOptionItem {
  id: number;
  menu_item_option_id: number;
  menu_item_id: number;
  price_modifier_type: string | null;
  price_modifier_amount_cents: number | null;
  price_modifier_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface MenuOption {
  id: number;
  category_id: number | null;
  title: string;
  min_selections: number;
  max_selections: number;
  created_at: string;
  updated_at: string;
  menu_item_ids: number[];
  menu_items?: MenuOptionMenuItem[];
  option_items?: MenuOptionItem[];
  option_assignments?: MenuOptionAssignment[];
  available_menu_items?: MenuOptionMenuItem[];
  category?: MenuOptionCategory | null;
}

export interface AiSuggestedMenuItem {
  id: number;
  name: string;
  price_cents: number;
  discounted_price_cents?: number | null;
  description?: string | null;
  reason?: string | null;
  photo_url?: string | null;
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
  remark?: string | null;
}

export type OrderStatus =
  | 'composing'
  | 'sent'
  | 'received'
  | 'printed'
  | 'preparing'
  | 'prepared'
  | 'distributed';

export interface Order {
  id: number;
  total_cents: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'delivered'
    | OrderStatus
    | string;
  state?: 'composing' | 'sent' | string;
  payment_state?: string;
  paid_cents?: number;
  remaining_balance_cents?: number;
  order_items: OrderItem[];
  remark?: string | null;
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

export interface SalesPipelineReport {
  timeframe: {
    start_date: string;
    end_date: string;
  };
  totals: {
    orders: number;
    revenue_cents: number;
    average_order_value_cents: number;
  };
  status_breakdown: { status: OrderStatus; order_count: number }[];
  status_progression: { status: OrderStatus; order_count: number }[];
  scenario_breakdown: { scenario: OrderScenario; order_count: number }[];
  target_time_type_breakdown: { target_time_type: OrderTargetTimeType; order_count: number }[];
  daily_totals: { date: string; order_count: number; revenue_cents: number }[];
  top_menu_items: {
    menu_item_id: number;
    menu_item_name: string;
    quantity: number;
    revenue_cents: number;
  }[];
  category_revenue: {
    category_id: number;
    category_name: string;
    revenue_cents: number;
  }[];
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
  remark?: string | null;
}

export interface SessionUser {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  birthDate?: string | null;
}

export type RestaurantUserChurnRisk = 'low' | 'medium' | 'high';

export interface RestaurantUser {
  id: number;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  churn_risk?: RestaurantUserChurnRisk | null;
  last_order_at?: string | null;
  order_count?: number | null;
  orders_count?: number | null;
  total_orders?: number | null;
  loyalty_points?: number | null;
  loyaltyPoints?: number | null;
  credit_cents?: number | null;
  creditCents?: number | null;
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