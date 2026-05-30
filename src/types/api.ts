// ─── Global Response Wrappers ───────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Pagination ─────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  meta: PaginationMeta;
}

// ─── Auth ───────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────

export interface PlatformOverview {
  totalBusinesses: number;
  totalTransactions: number;
  totalRevenue: number;
  activeStaff: number;
}

// ─── Analytics ──────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string;
  total?: number;
  count?: number;
}

export interface VerificationFunnelItem {
  verificationStatus: "VERIFIED" | "PENDING" | "REJECTED";
  count: number;
}

export interface ActiveBusinesses {
  dau: number;
  mau: number;
}

export interface FeatureAdoption {
  totalBusinesses: number;
  usingInvoices: number;
  usingStaff: number;
  usingDebts: number;
  percentUsingInvoices: number;
  percentUsingStaff: number;
  percentUsingDebts: number;
}

export interface PlatformDebtItem {
  type: "receivable" | "payable";
  totalOutstanding: number;
}

export interface AverageVolume {
  totalBusinesses: number;
  totalVolume: number;
  arpu: number;
}

export interface TopBusiness {
  businessId: string;
  totalVolume: number;
  businessName: string;
}

export interface IndustryCategory {
  category: string | null;
  count: number;
}

// ─── Businesses ─────────────────────────────────────────────────────

export interface BusinessListItem {
  id: string;
  name: string;
  ownerId: string;
  owner: {
    id: string;
    phone: string;
    name: string;
  };
  ownerPhone: string;
  email: string | null;
  category: string | null;
  businessType: string | null;
  state: string | null;
  city: string | null;
  isActive: boolean;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  plan: {
    id: string;
    name: string;
    label: string;
    price: string;
  } | null;
  planName?: string;
  createdAt: string;
  _count: {
    transactions: number;
    products: number;
    staff: number;
  };
}

export interface TransactionLine {
  productName: string;
  qty: number;
  unitPrice: string;
  unitCost: string;
}

export interface RecentTransaction {
  id: string;
  type: string;
  amount: string;
  amountPaid: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
  lines: TransactionLine[];
}

export interface BusinessDetail extends BusinessListItem {
  logoUrl: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  verificationDocs: string[];
  owner: { id: string; phone: string; name: string };
  plan: { id: string; name: string; label: string; price: string } | null;
  ownerBusinesses: {
    id: string;
    name: string;
    businessType: string | null;
    category: string | null;
    isActive: boolean;
    plan: { name: string; label: string } | null;
  }[];
  _count: BusinessListItem["_count"] & { contacts: number };
  recentTransactions: RecentTransaction[];
}

export interface UpdateBusinessStatusRequest {
  isActive: boolean;
}

export interface DeleteBusinessResponse {
  businessName: string;
  businessId: string;
}

// ─── Verifications ──────────────────────────────────────────────────

export interface PendingVerification {
  id: string;
  name: string;
  ownerPhone: string;
  verificationDocs: string[];
  createdAt: string;
}

export interface VerifyBusinessRequest {
  status: "VERIFIED" | "REJECTED";
  notes?: string;
}

// ─── Global Search ──────────────────────────────────────────────────

export interface SearchTransaction {
  id: string;
  businessId: string;
  type: string;
  amount: string;
  amountPaid: string;
  paymentMethod: string;
  contactName: string;
  createdAt: string;
}

export interface SearchInvoice {
  id: string;
  invoiceNumber: string;
  businessId: string;
  customerName: string;
  totalAmount: string;
  status: string;
  createdAt: string;
}

export interface SearchBusiness {
  id: string;
  name: string;
  ownerPhone: string;
  email: string;
  isActive: boolean;
  verificationStatus: string;
  createdAt: string;
}

export interface GlobalSearchResult {
  transactions: SearchTransaction[];
  invoices: SearchInvoice[];
  businesses: SearchBusiness[];
}

// ─── Audit Logs ─────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetId: string | null;
  details: string | null;
  createdAt: string;
  admin: {
    name: string;
    email: string;
  };
}

// ─── Analytics Query Params ─────────────────────────────────────────

export type AnalyticsRange =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "90d"
  | "1y"
  | "all";

export interface AnalyticsParams {
  range?: AnalyticsRange;
  category?: string;
}

// ─── New Analytics Response Types ───────────────────────────────────

export interface TransactionsVolumePoint {
  date: string;
  count: number;
  total: number;
}

export interface RevenueByCategoryItem {
  category: string | null;
  totalRevenue: number;
  transactionCount: number;
}

export interface ComparisonMetricData {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number | null;
}

export interface ComparisonData {
  period: { start: string; end: string };
  previous: { start: string; end: string };
  metrics: {
    revenue: ComparisonMetricData;
    transactions: ComparisonMetricData;
    signups: ComparisonMetricData;
    activeBusinesses: ComparisonMetricData;
  };
}

// ─── Admin Accounts ────────────────────────────────────────────────

export type AdminRole = "SUPER_ADMIN" | "SUPPORT_ADMIN" | "ANALYST";

export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  isActive?: boolean;
}

export interface UpdateAdminRequest {
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
}

// ─── Notifications ──────────────────────────────────────────────────

export interface BroadcastNotificationRequest {
  title: string;
  body: string;
}

export interface BroadcastNotificationResponse {
  success: boolean;
  count: number;
}

export interface TargetedNotificationRequest {
  businessId: string;
  title: string;
  body: string;
}

export interface TargetedNotificationResponse {
  success: boolean;
}

// ─── Subscriptions & Plans ──────────────────────────────────────────

export interface PlanFeature {
  feature: {
    key: string;
    name: string;
    category: string;
  };
  isEnabled: boolean;
}

export interface Plan {
  id: string;
  name: string;
  label: string;
  price: string;
  maxTransactions: number;
  maxProducts: number;
  maxStaff: number;
  maxContacts: number;
  maxProjects: number;
  maxProperties: number;
  maxInvoicePDFs: number;
  features: PlanFeature[];
}

export interface CreatePlanRequest {
  name: string;
  label: string;
  price: string;
  maxTransactions?: number;
  maxProducts?: number;
  maxStaff?: number;
  maxContacts?: number;
  maxProjects?: number;
  maxProperties?: number;
  maxInvoicePDFs?: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
}

export interface ToggleFeatureRequest {
  isEnabled: boolean;
}

export interface AssignPlanRequest {
  planId: string;
}

export interface AssignPlanResponse {
  businessId: string;
  businessName: string;
  plan: string;
  message: string;
}

export interface DeleteBusinessResponse {
  deleted: boolean;
  businessId: string;
  businessName: string;
}

// ─── Subscription Businesses ──────────────────────────────────────

export interface SubscribedBusiness {
  id: string;
  name: string;
  ownerPhone: string;
  businessType: string | null;
  category: string | null;
  isActive: boolean;
  planActivatedAt: string | null;
  planExpiresAt: string | null;
  createdAt: string;
  plan: {
    id: string;
    name: string;
    label: string;
    price: string;
  };
}

export interface SubscriptionOverview {
  totalSubscribers: number;
  totalEstimatedRevenue: number;
  plans: {
    planLabel: string;
    subscriberCount: number;
    price: number;
    estimatedMonthlyRevenue: number;
  }[];
  recentChanges: {
    targetId: string;
    details: string;
    createdAt: string;
    admin: { name: string };
  }[];
}

// ─── Owners ───────────────────────────────────────────────────────

export interface OwnerBusiness {
  id: string;
  name: string;
  businessType: string | null;
  isActive: boolean;
  plan: { name: string; label: string } | null;
}

export interface OwnerListItem {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
  businessCount: number;
  businesses: OwnerBusiness[];
}
