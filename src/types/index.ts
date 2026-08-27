export type UserRole = 'admin' | 'subuser';
export type UserStatus = 'active' | 'inactive';

export type PermissionAction = 'view' | 'add' | 'update' | 'delete' | 'approve' | 'export';

export type PermissionModule =
  | 'dashboard'
  | 'influencers'
  | 'targets'
  | 'deliveries'
  | 'influencer_payments'
  | 'billboards'
  | 'billboard_payments'
  | 'lcd_screens'
  | 'lcd_videos'
  | 'lcd_payments'
  | 'budget'
  | 'expenses'
  | 'reports'
  | 'users';

export type ModulePermissions = Record<PermissionAction, boolean>;

export type UserPermissions = Record<PermissionModule, Partial<ModulePermissions>>;

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profilePhoto?: string;
  permissions: UserPermissions;
  password?: string;
  createdAt: string;
  lastLogin?: string;
}

// Influencer Types
export type InfluencerCategory = 'Beauty' | 'Cosmetics' | 'Fashion' | 'Tech' | 'Lifestyle' | 'Food' | 'Fitness' | 'Other';
export type InfluencerStatus = 'Active' | 'Inactive';

export interface Influencer {
  id: string;
  fullName: string;
  tiktokUsername?: string;
  instagramUsername?: string;
  phone: string;
  location: string;
  category: InfluencerCategory;
  followers: number;
  profileUrl?: string;
  targetVideosPerMonth: number;
  salary: number;
  paymentMethod: string;
  paymentAccount: string;
  agreementStart: string; // YYYY-MM-DD
  agreementEnd: string;   // YYYY-MM-DD
  status: InfluencerStatus;
  notes?: string;
  profilePhoto?: string;
  contractFile?: string;
  createdAt: string;
}

export type TargetStatus = 'On Target' | 'Below Target' | 'Target Completed' | 'Exceeded';

export interface InfluencerTarget {
  id: string;
  influencerId: string;
  influencerName: string;
  monthYear: string; // e.g., "2026-08"
  targetVideos: number;
  completedVideos: number;
  remainingVideos: number;
  achievementPercent: number;
  status: TargetStatus;
  updatedAt: string;
}

export type DeliveryStatus = 'Pending' | 'Sent' | 'Received' | 'Cancelled';
export type DeliveryPaymentStatus = 'Unpaid' | 'Pending Approval' | 'Approved' | 'Paid';

export interface DeliveryRecord {
  id: string;
  deliveryId: string; // e.g. DEL-001
  influencerId: string;
  influencerName: string;
  product: string;
  quantity: number;
  date: string;
  unitPrice: number;
  totalPrice: number;
  deliveryStatus: DeliveryStatus;
  paymentStatus: DeliveryPaymentStatus;
  paymentAmount: number;
  paymentDueDate: string;
  paymentDate?: string;
  paymentReference?: string;
  deliveryProof?: string;
  paymentProof?: string;
  notes?: string;
  createdAt: string;
}

// Billboard Types
export type BillboardStatus = 'Available' | 'Reserved' | 'Active' | 'Expired' | 'Maintenance';
export type BillboardOpStatus = 'Artwork' | 'Approved' | 'Printed' | 'Installed' | 'Active' | 'Expired';

export interface Billboard {
  id: string;
  billboardId: string; // e.g. BB-024
  location: string;
  exactAddress: string;
  districtArea: string;
  gpsLocation?: string;
  size: string; // e.g. "12m x 4m"
  billboardType: string; // Unipole, Wall, Rooftop, Digital
  ownerProvider: string;
  contact: string;
  rentPrice: number;
  currency: string;
  paymentFrequency: 'Monthly' | 'Quarterly' | 'Bi-Annually' | 'Annually';
  installationCost: number;
  printingCost: number;
  agreementStart: string;
  agreementEnd: string;
  currentProduct?: string;
  currentCampaign?: string;
  status: BillboardStatus;
  opStatus: BillboardOpStatus;
  installationProof?: string;
  notes?: string;
  photos?: string[];
  contract?: string;
  createdAt: string;
}

// LCD Screen Types
export type LCDStatus = 'Available' | 'Reserved' | 'Active' | 'Expired' | 'Maintenance';
export type LCDVideoStatus = 'Pending' | 'Submitted' | 'Approved' | 'Showing' | 'Ended' | 'Rejected';

export interface LCDScreen {
  id: string;
  screenId: string; // e.g. LCD-003
  screenName: string;
  location: string;
  exactAddress: string;
  screenSize: string; // e.g. "2496 x 192 px"
  resolution: string;
  screenType: string;
  ownerProvider: string;
  contact: string;
  rentPrice: number;
  currency: string;
  paymentFrequency: 'Monthly' | 'Quarterly' | 'Annually';
  agreementStart: string;
  agreementEnd: string;
  currentProduct?: string;
  currentCampaign?: string;
  status: LCDStatus;
  notes?: string;
  photos?: string[];
  contract?: string;
  createdAt: string;
}

export interface LCDVideo {
  id: string;
  videoId: string; // VID-101
  screenId: string;
  screenName: string;
  videoName: string;
  product: string;
  campaign: string;
  videoFileUrl?: string;
  duration: string; // e.g., "15 sec"
  resolution: string;
  submittedDate: string;
  startDate: string;
  endDate: string;
  status: LCDVideoStatus;
  proofMedia?: string;
  notes?: string;
  createdAt: string;
}

// Budget & Expenses Types
export type BudgetType = 'Local' | 'International';
export type BudgetCategory =
  | 'Influencers'
  | 'Billboards'
  | 'LCD Screens'
  | 'Product Delivery'
  | 'Printing'
  | 'Production'
  | 'Other Marketing Operations';

export type BudgetWarningLevel = 'Normal' | 'Warning' | 'Critical' | 'Exceeded';

export interface Budget {
  id: string;
  budgetId: string;
  period: string; // e.g. "August 2026" or "2026-Q3"
  budgetType: BudgetType;
  category: BudgetCategory;
  allocated: number;
  committed: number;
  spent: number;
  remaining: number; // calculated: allocated - committed - spent
  warningLevel: BudgetWarningLevel;
  createdAt: string;
}

export type ExpensePaymentStatus = 'Unpaid' | 'Pending Approval' | 'Approved' | 'Paid';

export interface Expense {
  id: string;
  expenseId: string;
  date: string;
  category: BudgetCategory;
  budgetType: BudgetType;
  amount: number;
  currency: string;
  description: string;
  relatedInfluencerId?: string;
  relatedInfluencerName?: string;
  relatedBillboardId?: string;
  relatedBillboardName?: string;
  relatedLCDId?: string;
  relatedLCDName?: string;
  relatedActivity?: string;
  requestedBy: string;
  approvedBy?: string;
  paymentStatus: ExpensePaymentStatus;
  receipt?: string;
  notes?: string;
  createdAt: string;
}

// Central Payment Ledger Types
export type CentralPaymentType = 'Influencer' | 'Billboard' | 'LCD Screen' | 'Other Marketing Expense';
export type CentralPaymentStatus = 'Unpaid' | 'Pending Approval' | 'Approved' | 'Paid';

export interface CentralPayment {
  id: string;
  paymentId: string; // e.g. INF-0021, BB-0081, LCD-0012, EXP-901
  paymentType: CentralPaymentType;
  recipient: string;
  reference: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: CentralPaymentStatus;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentProof?: string;
  relatedEntityId?: string; // ID of Delivery, Billboard, LCD, or Expense
  budgetType?: BudgetType;
  notes?: string;
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  user: string;
  username: string;
  action: string;
  module: PermissionModule | 'Auth';
  record: string;
  dateTime: string;
  previousValue?: string;
  newValue?: string;
}

// Alert Item
export interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info';
  module: string;
  title: string;
  message: string;
  actionUrl?: string;
  date: string;
}
