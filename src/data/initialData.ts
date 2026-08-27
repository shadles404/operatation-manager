import { UserPermissions } from '../types';

export const ALL_MODULES = [
  'dashboard',
  'influencers',
  'targets',
  'deliveries',
  'influencer_payments',
  'billboards',
  'billboard_payments',
  'lcd_screens',
  'lcd_videos',
  'lcd_payments',
  'budget',
  'expenses',
  'reports',
  'users'
] as const;

export const fullAdminPermissions: UserPermissions = {
  dashboard: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  influencers: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  targets: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  deliveries: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  influencer_payments: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  billboards: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  billboard_payments: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  lcd_screens: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  lcd_videos: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  lcd_payments: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  budget: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  expenses: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  reports: { view: true, add: true, update: true, delete: true, approve: true, export: true },
  users: { view: true, add: true, update: true, delete: true, approve: true, export: true },
};

export const defaultManagerPermissions: UserPermissions = {
  dashboard: { view: true, add: false, update: false, delete: false, approve: false, export: true },
  influencers: { view: true, add: true, update: true, delete: false, approve: false, export: true },
  targets: { view: true, add: true, update: true, delete: false, approve: false, export: true },
  deliveries: { view: true, add: true, update: true, delete: false, approve: false, export: true },
  influencer_payments: { view: true, add: true, update: true, delete: false, approve: false, export: false },
  billboards: { view: true, add: true, update: true, delete: false, approve: false, export: true },
  billboard_payments: { view: true, add: false, update: false, delete: false, approve: false, export: false },
  lcd_screens: { view: true, add: true, update: true, delete: false, approve: false, export: true },
  lcd_videos: { view: true, add: true, update: true, delete: false, approve: false, export: true },
  lcd_payments: { view: true, add: false, update: false, delete: false, approve: false, export: false },
  budget: { view: true, add: false, update: false, delete: false, approve: false, export: true },
  expenses: { view: true, add: true, update: true, delete: false, approve: false, export: true },
  reports: { view: true, add: false, update: false, delete: false, approve: false, export: true },
  users: { view: false, add: false, update: false, delete: false, approve: false, export: false },
};
