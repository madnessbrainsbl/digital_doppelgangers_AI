export type PhoneNumber = {
  phone_number: string;
  phone_price: number;
  phone_region_name: string;
  phone_country_code: string;
  phone_category_name?: string;
  is_selected?: boolean;
  phone_purchase_date: string;
  account_id?: number;
  auto_charge?: boolean;
  can_be_used?: boolean;
  category_name?: string;
  deactivated?: boolean;
  is_sms_enabled?: boolean;
  is_sms_supported?: boolean;
  issues?: any[];
  modified?: string;
  phone_id?: number;
  phone_next_renewal: string;
  phone_region_id?: number;
  subscription_id?: number;
  verification_status?: string;
};

export type User = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  plan?: string | null;
  balance?: number | null;
  referrerId?: number | null;
  managerId?: number | null;
  referralCode?: string | null;
  totalSpent?: number;
};

export type SmsDirection = "IN" | "OUT" | "ALL";

export type SmsHistoryItem = {
  messageId: number;
  sourceNumber: string;
  destinationNumber: string;
  text?: string;
  direction: string;
  processedDate: string;
  statusId: string;
  cost: number;
  fragments: number;
  errorMessage?: string;
  transactionId?: number;
};

export type SmsHistoryResponse = {
  result: SmsHistoryItem[];
  total_count: number;
};

export type SmsHistoryFilters = {
  direction?: SmsDirection;
  sourceNumber?: string;
  destinationNumber?: string;
  fromDate?: Date;
  toDate?: Date;
};
