import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth, getSecondaryAuth } from '../firebase';
import {
  User,
  Influencer,
  InfluencerStatus,
  InfluencerTarget,
  DeliveryRecord,
  DeliveryStatus,
  Billboard,
  BillboardStatus,
  BillboardOpStatus,
  LCDScreen,
  LCDVideo,
  Budget,
  Expense,
  CentralPayment,
  CentralPaymentStatus,
  AuditLog,
  AlertItem,
  UserPermissions,
  PermissionModule,
  PermissionAction
} from '../types';
import { fullAdminPermissions } from '../data/initialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'mop_current_user_v2',
};

function loadItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
  }
  return defaultVal;
}

function saveItem<T>(key: string, val: T): void {
  try {
    if (val === null || val === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeFirestoreData(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean as T;
}

class StoreService {
  private users: User[] = [];
  private influencers: Influencer[] = [];
  private targets: InfluencerTarget[] = [];
  private deliveries: DeliveryRecord[] = [];
  private billboards: Billboard[] = [];
  private lcdScreens: LCDScreen[] = [];
  private lcdVideos: LCDVideo[] = [];
  private budgets: Budget[] = [];
  private expenses: Expense[] = [];
  private payments: CentralPayment[] = [];
  private auditLogs: AuditLog[] = [];
  private currentUser: User | null = null;

  private snapshotUnsubs: (() => void)[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.currentUser = loadItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    this.initAuthObserver();
  }

  private initAuthObserver() {
    onAuthStateChanged(auth, async authUser => {
      if (authUser) {
        try {
          const userDocRef = doc(db, 'users', authUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const userData = { id: snap.id, ...snap.data() } as User;
            if (userData.status === 'active') {
              this.currentUser = userData;
              saveItem(STORAGE_KEYS.CURRENT_USER, userData);
            } else {
              await signOut(auth);
              this.currentUser = null;
              saveItem(STORAGE_KEYS.CURRENT_USER, null);
            }
          }
        } catch (e) {
          console.error('Error fetching auth user profile:', e);
        }
        this.initFirestoreListeners();
      } else {
        this.stopFirestoreListeners();
        this.currentUser = null;
        saveItem(STORAGE_KEYS.CURRENT_USER, null);
      }
      this.notifyListeners();
    });
  }

  private stopFirestoreListeners() {
    this.snapshotUnsubs.forEach(unsub => {
      try {
        unsub();
      } catch (e) {
        // ignore cleanup errors
      }
    });
    this.snapshotUnsubs = [];
    this.users = [];
    this.influencers = [];
    this.targets = [];
    this.deliveries = [];
    this.billboards = [];
    this.lcdScreens = [];
    this.lcdVideos = [];
    this.budgets = [];
    this.expenses = [];
    this.payments = [];
    this.auditLogs = [];
  }

  private initFirestoreListeners() {
    if (this.snapshotUnsubs.length > 0) return;
    if (!auth.currentUser) return;

    // 1. Users Collection - strictly from Firebase Firestore
    this.listenCollection<User>('users', [], data => {
      this.users = data;
      if (this.currentUser) {
        const found = this.users.find(u => u.id === this.currentUser?.id);
        if (found && found.status === 'active') {
          this.currentUser = found;
          saveItem(STORAGE_KEYS.CURRENT_USER, found);
        } else if (found && found.status === 'inactive') {
          this.logout();
        }
      }
    });

    // 2. Influencers
    this.listenCollection<Influencer>('influencers', [], data => {
      this.influencers = data;
    });

    // 3. Targets
    this.listenCollection<InfluencerTarget>('targets', [], data => {
      this.targets = data;
    });

    // 4. Deliveries
    this.listenCollection<DeliveryRecord>('deliveries', [], data => {
      this.deliveries = data;
    });

    // 5. Billboards
    this.listenCollection<Billboard>('billboards', [], data => {
      this.billboards = data;
    });

    // 6. LCD Screens
    this.listenCollection<LCDScreen>('lcd_screens', [], data => {
      this.lcdScreens = data;
    });

    // 7. LCD Videos
    this.listenCollection<LCDVideo>('lcd_videos', [], data => {
      this.lcdVideos = data;
    });

    // 8. Budgets
    this.listenCollection<Budget>('budgets', [], data => {
      this.budgets = data;
    });

    // 9. Expenses
    this.listenCollection<Expense>('expenses', [], data => {
      this.expenses = data;
    });

    // 10. Payments
    this.listenCollection<CentralPayment>('payments', [], data => {
      this.payments = data;
    });

    // 11. Audit Logs
    this.listenCollection<AuditLog>('audit_logs', [], data => {
      this.auditLogs = data;
    });
  }

  private listenCollection<T extends { id: string }>(
    colName: string,
    initialData: T[],
    onUpdate: (data: T[]) => void
  ) {
    const colRef = collection(db, colName);

    const unsub = onSnapshot(colRef, snapshot => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
        onUpdate(items);
      } else {
        onUpdate([]);
      }
      this.recalculateAll();
      this.notifyListeners();
    }, err => {
      console.warn(`Firestore snapshot notice for ${colName}:`, err.message);
    });

    this.snapshotUnsubs.push(unsub);
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }

  public getInitialSubUserPermissions(): UserPermissions {
    return {
      dashboard: { view: true },
      influencers: { view: true, add: false, update: false, delete: false, export: false },
      targets: { view: true, update: false },
      deliveries: { view: true, add: false, update: false, delete: false, export: false },
      influencer_payments: { view: true, approve: false, update: false },
      billboards: { view: true, add: false, update: false, delete: false, export: false },
      billboard_payments: { view: true, approve: false, update: false },
      lcd_screens: { view: true, add: false, update: false, delete: false, export: false },
      lcd_videos: { view: true, add: false, update: false, delete: false },
      lcd_payments: { view: true, approve: false, update: false },
      budget: { view: true, add: false, update: false, export: false },
      expenses: { view: true, add: false, update: false, delete: false, approve: false, export: false },
      reports: { view: true, export: false },
      users: { view: false, add: false, update: false, delete: false },
    };
  }

  public recalculateAll() {
    this.targets = this.targets.map(t => {
      const remaining = Math.max(0, t.targetVideos - t.completedVideos);
      const achievement = t.targetVideos > 0 ? Number(((t.completedVideos / t.targetVideos) * 100).toFixed(1)) : 0;
      let status = t.status;
      if (t.completedVideos === 0) status = 'Below Target';
      else if (t.completedVideos > t.targetVideos) status = 'Exceeded';
      else if (t.completedVideos === t.targetVideos) status = 'Target Completed';
      else status = 'Below Target';

      return {
        ...t,
        remainingVideos: remaining,
        achievementPercent: achievement,
        status,
      };
    });

    this.budgets = this.budgets.map(b => {
      const remaining = b.allocated - b.committed - b.spent;
      const totalUsed = b.spent + b.committed;
      const percentUsed = b.allocated > 0 ? (totalUsed / b.allocated) * 100 : 0;
      let warningLevel = b.warningLevel;
      if (percentUsed >= 100) warningLevel = 'Exceeded';
      else if (percentUsed >= 90) warningLevel = 'Critical';
      else if (percentUsed >= 80) warningLevel = 'Warning';
      else warningLevel = 'Normal';

      return {
        ...b,
        remaining,
        warningLevel,
      };
    });

    if (this.currentUser) {
      saveItem(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }
  }

  public logAudit(action: string, module: PermissionModule | 'Auth', record: string, prev?: string, nextVal?: string) {
    const user = this.currentUser ? this.currentUser.fullName : 'System';
    const username = this.currentUser ? this.currentUser.username : 'system';
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      user,
      username,
      action,
      module,
      record,
      dateTime: new Date().toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      previousValue: prev,
      newValue: nextVal
    };
    this.auditLogs.unshift(newLog);
    setDoc(doc(db, 'audit_logs', newLog.id), sanitizeFirestoreData(newLog)).catch(err => {
      console.error('Error saving audit log to Firestore:', err);
    });
  }

  public hasPermission(module: PermissionModule, action: PermissionAction): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    const modPerms = this.currentUser.permissions?.[module];
    if (!modPerms) return false;
    return !!modPerms[action];
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // --- Firebase Authentication & System Registration ---
  public async login(userOrEmail: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      let email = userOrEmail.trim();

      if (!email.includes('@')) {
        const found = this.users.find(u => u.username.toLowerCase() === email.toLowerCase());
        if (found && found.email) {
          email = found.email;
        } else {
          email = `${email.toLowerCase()}@marketingops.com`;
        }
      }

      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;

      const snap = await getDoc(doc(db, 'users', uid));
      let userDoc: User;

      if (snap.exists()) {
        userDoc = { id: snap.id, ...snap.data() } as User;
      } else {
        // Fallback for primary initial user if profile missing
        userDoc = {
          id: uid,
          fullName: cred.user.displayName || email.split('@')[0],
          username: email.split('@')[0],
          email,
          phone: '',
          role: 'admin',
          status: 'active',
          permissions: fullAdminPermissions,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', uid), sanitizeFirestoreData(userDoc));
      }

      if (userDoc.status === 'inactive') {
        await signOut(auth);
        return { success: false, error: 'Account is deactivated. Please contact System Administrator.' };
      }

      userDoc.lastLogin = new Date().toISOString();
      await updateDoc(doc(db, 'users', uid), { lastLogin: userDoc.lastLogin }).catch(e => console.error(e));

      this.currentUser = userDoc;
      saveItem(STORAGE_KEYS.CURRENT_USER, userDoc);
      this.logAudit('User Logged In', 'Auth', `${userDoc.fullName} (${userDoc.username})`);
      this.notifyListeners();
      return { success: true, user: userDoc };
    } catch (err: any) {
      console.error('Firebase Auth Login Error:', err);
      let msg = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email/username or password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      return { success: false, error: msg };
    }
  }

  public async registerInitialAdmin(fullName: string, email: string, pass: string, phone?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;
      const adminUser: User = {
        id: uid,
        fullName,
        username: email.split('@')[0],
        email,
        phone: phone || '',
        role: 'admin',
        status: 'active',
        permissions: fullAdminPermissions,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', uid), sanitizeFirestoreData(adminUser));
      this.currentUser = adminUser;
      saveItem(STORAGE_KEYS.CURRENT_USER, adminUser);
      this.logAudit('Registered System Admin', 'Auth', fullName);
      this.notifyListeners();
      return { success: true, user: adminUser };
    } catch (err: any) {
      console.error('Firebase Auth Admin Register Error:', err);
      return { success: false, error: err.message || 'Failed to register system admin' };
    }
  }

  public async logout() {
    if (this.currentUser) {
      this.logAudit('User Logged Out', 'Auth', `${this.currentUser.fullName}`);
    }
    await signOut(auth).catch(e => console.error(e));
    this.currentUser = null;
    saveItem(STORAGE_KEYS.CURRENT_USER, null);
    this.notifyListeners();
  }

  public async changePassword(oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> {
    if (!auth.currentUser || !this.currentUser) return { success: false, error: 'Not logged in' };
    if (newPass.length < 6) return { success: false, error: 'Password must be at least 6 characters long' };

    try {
      await updatePassword(auth.currentUser, newPass);
      this.logAudit('Changed Password', 'Auth', this.currentUser.username);
      this.notifyListeners();
      return { success: true };
    } catch (err: any) {
      console.error('Firebase Auth Password Update Error:', err);
      return { success: false, error: err.message || 'Failed to update password' };
    }
  }

  // User & Sub-User Management
  public getUsers(): User[] {
    return this.users;
  }

  public async addUser(user: Omit<User, 'id' | 'createdAt'>, initialPassword?: string): Promise<{ success: boolean; data?: User; error?: string }> {
    if (!this.hasPermission('users', 'add')) {
      return { success: false, error: 'Permission denied: Admin authority required to add users' };
    }
    const subPass = initialPassword || 'password123';
    try {
      const secAuth = getSecondaryAuth();
      const cred = await createUserWithEmailAndPassword(secAuth, user.email, subPass);
      const subUid = cred.user.uid;

      const newSubUser: User = {
        ...user,
        id: subUid,
        createdAt: new Date().toISOString()
      };

      delete newSubUser.password; // Do NOT store plain-text password in Firestore document

      await setDoc(doc(db, 'users', subUid), sanitizeFirestoreData(newSubUser));
      this.logAudit('Created Sub-User Account', 'users', newSubUser.fullName, undefined, `Role: ${newSubUser.role}, Status: ${newSubUser.status}`);
      this.notifyListeners();
      return { success: true, data: newSubUser };
    } catch (err: any) {
      console.error('Firebase Auth Sub-User Creation Error:', err);
      return { success: false, error: err.message || 'Failed to create sub-user authentication account' };
    }
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> {
    if (!this.hasPermission('users', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update users' };
    }
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return { success: false, error: 'User not found in database' };

    const oldUser = this.users[idx];
    const updatedUser = { ...oldUser, ...updates };
    delete updatedUser.password;
    this.users[idx] = updatedUser;

    if (this.currentUser && this.currentUser.id === id) {
      this.currentUser = updatedUser;
    }

    await setDoc(doc(db, 'users', id), sanitizeFirestoreData(updatedUser)).catch(e => console.error(e));
    this.logAudit('Updated User Account & Permissions', 'users', updatedUser.fullName, `Status: ${oldUser.status}`, `Status: ${updatedUser.status}`);
    this.notifyListeners();
    return { success: true, data: updatedUser };
  }

  public async adminResetPassword(id: string, newPass: string): Promise<{ success: boolean; error?: string }> {
    if (!this.hasPermission('users', 'update')) {
      return { success: false, error: 'Permission denied: Cannot reset user password' };
    }
    const target = this.users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found in database' };

    this.logAudit('Admin Reset Password', 'users', target.fullName);
    this.notifyListeners();
    return { success: true };
  }

  public async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.hasPermission('users', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete users' };
    }
    const target = this.users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found' };
    if (target.role === 'admin') return { success: false, error: 'Cannot delete the main System Administrator account' };

    this.users = this.users.filter(u => u.id !== id);
    await deleteDoc(doc(db, 'users', id)).catch(e => console.error(e));
    this.logAudit('Deleted User Account', 'users', target.fullName);
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeleteUsers(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('users', 'delete')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot delete users' };
    }
    let deletedCount = 0;
    for (const id of ids) {
      const res = await this.deleteUser(id);
      if (res.success) deletedCount++;
    }
    this.logAudit('Bulk Deleted Users', 'users', `${deletedCount} user accounts deleted`);
    return { success: true, count: deletedCount };
  }

  public async bulkUpdateUserStatus(ids: string[], status: 'active' | 'inactive'): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('users', 'update')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot update users' };
    }
    let updatedCount = 0;
    for (const id of ids) {
      const res = await this.updateUser(id, { status });
      if (res.success) updatedCount++;
    }
    this.logAudit('Bulk Updated User Status', 'users', `${updatedCount} accounts set to ${status}`);
    return { success: true, count: updatedCount };
  }

  // Influencer Management
  public getInfluencers(): Influencer[] {
    return this.influencers;
  }

  public addInfluencer(inf: Omit<Influencer, 'id' | 'createdAt'>): { success: boolean; data?: Influencer; error?: string } {
    if (!this.hasPermission('influencers', 'add')) {
      return { success: false, error: 'Permission denied: Cannot add influencers' };
    }
    const newInf: Influencer = {
      ...inf,
      id: `inf-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.influencers.push(newInf);
    setDoc(doc(db, 'influencers', newInf.id), sanitizeFirestoreData(newInf)).catch(e => console.error(e));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const newTarget: InfluencerTarget = {
      id: `trg-${Date.now()}`,
      influencerId: newInf.id,
      influencerName: newInf.fullName,
      monthYear: currentMonth,
      targetVideos: newInf.targetVideosPerMonth,
      completedVideos: 0,
      remainingVideos: newInf.targetVideosPerMonth,
      achievementPercent: 0,
      status: 'Below Target',
      updatedAt: new Date().toISOString(),
    };
    this.targets.push(newTarget);
    setDoc(doc(db, 'targets', newTarget.id), sanitizeFirestoreData(newTarget)).catch(e => console.error(e));

    if (newInf.salary > 0) {
      const newPay: CentralPayment = {
        id: `pay-${Date.now()}`,
        paymentId: `INF-${Math.floor(1000 + Math.random()*9000)}`,
        paymentType: 'Influencer',
        recipient: newInf.fullName,
        reference: `Salary (${currentMonth})`,
        amount: newInf.salary,
        currency: 'USD',
        dueDate: newInf.agreementEnd,
        status: 'Unpaid',
        relatedEntityId: newInf.id,
        budgetType: 'Local',
        notes: `Monthly agreement salary for ${newInf.fullName}`,
        createdAt: new Date().toISOString(),
      };
      this.payments.push(newPay);
      setDoc(doc(db, 'payments', newPay.id), sanitizeFirestoreData(newPay)).catch(e => console.error(e));
    }

    this.logAudit('Registered New Influencer', 'influencers', newInf.fullName, undefined, `Category: ${newInf.category}, Target: ${newInf.targetVideosPerMonth}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: newInf };
  }

  public updateInfluencer(id: string, updates: Partial<Influencer>): { success: boolean; data?: Influencer; error?: string } {
    if (!this.hasPermission('influencers', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update influencers' };
    }
    const idx = this.influencers.findIndex(i => i.id === id);
    if (idx === -1) return { success: false, error: 'Influencer not found' };

    const oldVal = this.influencers[idx];
    const updated = { ...oldVal, ...updates };
    this.influencers[idx] = updated;
    setDoc(doc(db, 'influencers', id), sanitizeFirestoreData(updated)).catch(e => console.error(e));

    this.targets = this.targets.map(t => {
      if (t.influencerId === id) {
        const nextT = {
          ...t,
          influencerName: updated.fullName,
          targetVideos: updates.targetVideosPerMonth !== undefined ? updates.targetVideosPerMonth : t.targetVideos
        };
        setDoc(doc(db, 'targets', t.id), sanitizeFirestoreData(nextT)).catch(e => console.error(e));
        return nextT;
      }
      return t;
    });

    this.logAudit('Updated Influencer Profile', 'influencers', updated.fullName, `Target: ${oldVal.targetVideosPerMonth}`, `Target: ${updated.targetVideosPerMonth}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: updated };
  }

  public deleteInfluencer(id: string): { success: boolean; error?: string } {
    if (!this.hasPermission('influencers', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete influencers' };
    }
    const inf = this.influencers.find(i => i.id === id);
    if (!inf) return { success: false, error: 'Influencer not found' };

    this.influencers = this.influencers.filter(i => i.id !== id);
    deleteDoc(doc(db, 'influencers', id)).catch(e => console.error(e));

    const toRemoveTargets = this.targets.filter(t => t.influencerId === id);
    this.targets = this.targets.filter(t => t.influencerId !== id);
    toRemoveTargets.forEach(t => deleteDoc(doc(db, 'targets', t.id)).catch(e => console.error(e)));

    this.logAudit('Deleted Influencer', 'influencers', inf.fullName);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeleteInfluencers(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('influencers', 'delete')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot delete influencers' };
    }
    let deletedCount = 0;
    for (const id of ids) {
      const res = this.deleteInfluencer(id);
      if (res.success) deletedCount++;
    }
    this.logAudit('Bulk Deleted Influencers', 'influencers', `${deletedCount} records deleted`);
    return { success: true, count: deletedCount };
  }

  public async bulkUpdateInfluencerStatus(ids: string[], status: InfluencerStatus): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('influencers', 'update')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot update influencers' };
    }
    let updatedCount = 0;
    for (const id of ids) {
      const res = this.updateInfluencer(id, { status });
      if (res.success) updatedCount++;
    }
    this.logAudit('Bulk Updated Influencer Status', 'influencers', `${updatedCount} updated to ${status}`);
    return { success: true, count: updatedCount };
  }

  // Target Tracking
  public getTargets(): InfluencerTarget[] {
    return this.targets;
  }

  public updateTarget(id: string, completedVideos: number): { success: boolean; data?: InfluencerTarget; error?: string } {
    if (!this.hasPermission('targets', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update targets' };
    }
    const idx = this.targets.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, error: 'Target record not found' };

    const oldT = this.targets[idx];
    this.targets[idx].completedVideos = Math.max(0, completedVideos);
    this.targets[idx].updatedAt = new Date().toISOString();

    setDoc(doc(db, 'targets', id), sanitizeFirestoreData(this.targets[idx])).catch(e => console.error(e));
    this.logAudit('Updated Influencer Video Progress', 'targets', oldT.influencerName, `Completed: ${oldT.completedVideos}`, `Completed: ${completedVideos}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: this.targets[idx] };
  }

  // Delivery Records
  public getDeliveries(): DeliveryRecord[] {
    return this.deliveries;
  }

  public addDelivery(del: Omit<DeliveryRecord, 'id' | 'createdAt' | 'deliveryId' | 'totalPrice'>): { success: boolean; data?: DeliveryRecord; error?: string } {
    if (!this.hasPermission('deliveries', 'add')) {
      return { success: false, error: 'Permission denied: Cannot add delivery records' };
    }
    const totalPrice = del.quantity * del.unitPrice;
    const count = this.deliveries.length + 1;
    const deliveryId = `DEL-${count.toString().padStart(3, '0')}`;
    const newDel: DeliveryRecord = {
      ...del,
      id: `del-rec-${Date.now()}`,
      deliveryId,
      totalPrice,
      paymentAmount: totalPrice,
      createdAt: new Date().toISOString(),
    };
    this.deliveries.push(newDel);
    setDoc(doc(db, 'deliveries', newDel.id), sanitizeFirestoreData(newDel)).catch(e => console.error(e));

    const centralPay: CentralPayment = {
      id: `pay-${Date.now()}`,
      paymentId: deliveryId,
      paymentType: 'Influencer',
      recipient: `${del.influencerName} (${del.product})`,
      reference: deliveryId,
      amount: totalPrice,
      currency: 'USD',
      dueDate: del.paymentDueDate,
      status: del.paymentStatus,
      relatedEntityId: newDel.id,
      budgetType: 'Local',
      notes: `Product Delivery for ${del.influencerName} - ${del.product}`,
      createdAt: new Date().toISOString()
    };
    this.payments.push(centralPay);
    setDoc(doc(db, 'payments', centralPay.id), sanitizeFirestoreData(centralPay)).catch(e => console.error(e));

    this.logAudit('Recorded Product Delivery', 'deliveries', `${deliveryId} (${del.influencerName})`, undefined, `Product: ${del.product}, Total: $${totalPrice}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: newDel };
  }

  public updateDelivery(id: string, updates: Partial<DeliveryRecord>): { success: boolean; data?: DeliveryRecord; error?: string } {
    if (!this.hasPermission('deliveries', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update delivery records' };
    }
    const idx = this.deliveries.findIndex(d => d.id === id);
    if (idx === -1) return { success: false, error: 'Delivery record not found' };

    const oldDel = this.deliveries[idx];
    const updated = { ...oldDel, ...updates };
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      updated.totalPrice = updated.quantity * updated.unitPrice;
      updated.paymentAmount = updated.totalPrice;
    }
    this.deliveries[idx] = updated;
    setDoc(doc(db, 'deliveries', id), sanitizeFirestoreData(updated)).catch(e => console.error(e));

    const pIdx = this.payments.findIndex(p => p.relatedEntityId === id || p.reference === oldDel.deliveryId);
    if (pIdx !== -1) {
      this.payments[pIdx].amount = updated.totalPrice;
      this.payments[pIdx].status = updated.paymentStatus;
      if (updated.paymentDate) this.payments[pIdx].paymentDate = updated.paymentDate;
      setDoc(doc(db, 'payments', this.payments[pIdx].id), sanitizeFirestoreData(this.payments[pIdx])).catch(e => console.error(e));
    }

    this.logAudit('Updated Delivery Record', 'deliveries', updated.deliveryId, `Status: ${oldDel.deliveryStatus}`, `Status: ${updated.deliveryStatus}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: updated };
  }

  public deleteDelivery(id: string): { success: boolean; error?: string } {
    if (!this.hasPermission('deliveries', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete delivery records' };
    }
    const del = this.deliveries.find(d => d.id === id);
    if (!del) return { success: false, error: 'Delivery record not found' };

    this.deliveries = this.deliveries.filter(d => d.id !== id);
    deleteDoc(doc(db, 'deliveries', id)).catch(e => console.error(e));

    const toRemovePays = this.payments.filter(p => p.relatedEntityId === id || p.reference === del.deliveryId);
    this.payments = this.payments.filter(p => p.relatedEntityId !== id && p.reference !== del.deliveryId);
    toRemovePays.forEach(p => deleteDoc(doc(db, 'payments', p.id)).catch(e => console.error(e)));

    this.logAudit('Deleted Delivery Record', 'deliveries', del.deliveryId);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeleteDeliveries(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('deliveries', 'delete')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot delete delivery records' };
    }
    let deletedCount = 0;
    for (const id of ids) {
      const res = this.deleteDelivery(id);
      if (res.success) deletedCount++;
    }
    this.logAudit('Bulk Deleted Deliveries', 'deliveries', `${deletedCount} records deleted`);
    return { success: true, count: deletedCount };
  }

  public async bulkUpdateDeliveryStatus(ids: string[], deliveryStatus: DeliveryStatus): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('deliveries', 'update')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot update delivery records' };
    }
    let updatedCount = 0;
    for (const id of ids) {
      const res = this.updateDelivery(id, { deliveryStatus });
      if (res.success) updatedCount++;
    }
    this.logAudit('Bulk Updated Delivery Status', 'deliveries', `${updatedCount} updated to ${deliveryStatus}`);
    return { success: true, count: updatedCount };
  }

  // Billboards
  public getBillboards(): Billboard[] {
    return this.billboards;
  }

  public addBillboard(bb: Omit<Billboard, 'id' | 'createdAt'>): { success: boolean; data?: Billboard; error?: string } {
    if (!this.hasPermission('billboards', 'add')) {
      return { success: false, error: 'Permission denied: Cannot add billboards' };
    }
    const newBB: Billboard = {
      ...bb,
      id: `bb-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.billboards.push(newBB);
    setDoc(doc(db, 'billboards', newBB.id), sanitizeFirestoreData(newBB)).catch(e => console.error(e));

    const newPay: CentralPayment = {
      id: `pay-${Date.now()}`,
      paymentId: `BB-${Math.floor(1000 + Math.random()*9000)}`,
      paymentType: 'Billboard',
      recipient: `${newBB.ownerProvider} (${newBB.billboardId})`,
      reference: newBB.billboardId,
      amount: newBB.rentPrice,
      currency: newBB.currency,
      dueDate: newBB.agreementEnd,
      status: 'Unpaid',
      relatedEntityId: newBB.id,
      budgetType: 'Local',
      notes: `Billboard Rent for ${newBB.location}`,
      createdAt: new Date().toISOString(),
    };
    this.payments.push(newPay);
    setDoc(doc(db, 'payments', newPay.id), sanitizeFirestoreData(newPay)).catch(e => console.error(e));

    this.logAudit('Registered New Billboard', 'billboards', newBB.billboardId, undefined, `Location: ${newBB.location}, Rent: $${newBB.rentPrice}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: newBB };
  }

  public updateBillboard(id: string, updates: Partial<Billboard>): { success: boolean; data?: Billboard; error?: string } {
    if (!this.hasPermission('billboards', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update billboards' };
    }
    const idx = this.billboards.findIndex(b => b.id === id);
    if (idx === -1) return { success: false, error: 'Billboard not found' };

    const oldVal = this.billboards[idx];
    const updated = { ...oldVal, ...updates };
    this.billboards[idx] = updated;
    setDoc(doc(db, 'billboards', id), sanitizeFirestoreData(updated)).catch(e => console.error(e));

    this.logAudit('Updated Billboard', 'billboards', updated.billboardId, `OpStatus: ${oldVal.opStatus}`, `OpStatus: ${updated.opStatus}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: updated };
  }

  public deleteBillboard(id: string): { success: boolean; error?: string } {
    if (!this.hasPermission('billboards', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete billboards' };
    }
    const bb = this.billboards.find(b => b.id === id);
    if (!bb) return { success: false, error: 'Billboard not found' };

    this.billboards = this.billboards.filter(b => b.id !== id);
    deleteDoc(doc(db, 'billboards', id)).catch(e => console.error(e));

    this.logAudit('Deleted Billboard', 'billboards', bb.billboardId);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeleteBillboards(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('billboards', 'delete')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot delete billboards' };
    }
    let deletedCount = 0;
    for (const id of ids) {
      const res = this.deleteBillboard(id);
      if (res.success) deletedCount++;
    }
    this.logAudit('Bulk Deleted Billboards', 'billboards', `${deletedCount} billboards deleted`);
    return { success: true, count: deletedCount };
  }

  public async bulkUpdateBillboardOpStatus(ids: string[], opStatus: BillboardOpStatus): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('billboards', 'update')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot update billboards' };
    }
    let updatedCount = 0;
    for (const id of ids) {
      const res = this.updateBillboard(id, { opStatus });
      if (res.success) updatedCount++;
    }
    this.logAudit('Bulk Updated Billboard Pipeline Status', 'billboards', `${updatedCount} billboards set to ${opStatus}`);
    return { success: true, count: updatedCount };
  }

  // LCD Screens
  public getLCDScreens(): LCDScreen[] {
    return this.lcdScreens;
  }

  public addLCDScreen(lcd: Omit<LCDScreen, 'id' | 'createdAt'>): { success: boolean; data?: LCDScreen; error?: string } {
    if (!this.hasPermission('lcd_screens', 'add')) {
      return { success: false, error: 'Permission denied: Cannot add LCD screens' };
    }
    const newLCD: LCDScreen = {
      ...lcd,
      id: `lcd-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.lcdScreens.push(newLCD);
    setDoc(doc(db, 'lcd_screens', newLCD.id), sanitizeFirestoreData(newLCD)).catch(e => console.error(e));

    const newPay: CentralPayment = {
      id: `pay-${Date.now()}`,
      paymentId: `LCD-${Math.floor(1000 + Math.random()*9000)}`,
      paymentType: 'LCD Screen',
      recipient: `${newLCD.ownerProvider} (${newLCD.screenId})`,
      reference: newLCD.screenId,
      amount: newLCD.rentPrice,
      currency: newLCD.currency,
      dueDate: newLCD.agreementEnd,
      status: 'Unpaid',
      relatedEntityId: newLCD.id,
      budgetType: 'Local',
      notes: `LCD Screen Rent for ${newLCD.screenName}`,
      createdAt: new Date().toISOString(),
    };
    this.payments.push(newPay);
    setDoc(doc(db, 'payments', newPay.id), sanitizeFirestoreData(newPay)).catch(e => console.error(e));

    this.logAudit('Registered New LCD Screen', 'lcd_screens', newLCD.screenId, undefined, `Name: ${newLCD.screenName}, Rent: $${newLCD.rentPrice}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: newLCD };
  }

  public updateLCDScreen(id: string, updates: Partial<LCDScreen>): { success: boolean; data?: LCDScreen; error?: string } {
    if (!this.hasPermission('lcd_screens', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update LCD screens' };
    }
    const idx = this.lcdScreens.findIndex(l => l.id === id);
    if (idx === -1) return { success: false, error: 'LCD screen not found' };

    const oldVal = this.lcdScreens[idx];
    const updated = { ...oldVal, ...updates };
    this.lcdScreens[idx] = updated;
    setDoc(doc(db, 'lcd_screens', id), sanitizeFirestoreData(updated)).catch(e => console.error(e));

    this.logAudit('Updated LCD Screen', 'lcd_screens', updated.screenId, `Status: ${oldVal.status}`, `Status: ${updated.status}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: updated };
  }

  public deleteLCDScreen(id: string): { success: boolean; error?: string } {
    if (!this.hasPermission('lcd_screens', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete LCD screens' };
    }
    const lcd = this.lcdScreens.find(l => l.id === id);
    if (!lcd) return { success: false, error: 'LCD Screen not found' };

    this.lcdScreens = this.lcdScreens.filter(l => l.id !== id);
    deleteDoc(doc(db, 'lcd_screens', id)).catch(e => console.error(e));

    const toRemoveVids = this.lcdVideos.filter(v => v.screenId === id);
    this.lcdVideos = this.lcdVideos.filter(v => v.screenId !== id);
    toRemoveVids.forEach(v => deleteDoc(doc(db, 'lcd_videos', v.id)).catch(e => console.error(e)));

    this.logAudit('Deleted LCD Screen', 'lcd_screens', lcd.screenId);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeleteLCDScreens(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('lcd_screens', 'delete')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot delete LCD screens' };
    }
    let deletedCount = 0;
    for (const id of ids) {
      const res = this.deleteLCDScreen(id);
      if (res.success) deletedCount++;
    }
    this.logAudit('Bulk Deleted LCD Screens', 'lcd_screens', `${deletedCount} screens deleted`);
    return { success: true, count: deletedCount };
  }

  public async bulkUpdateLCDScreenStatus(ids: string[], status: LCDScreen['status']): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('lcd_screens', 'update')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot update LCD screens' };
    }
    let updatedCount = 0;
    for (const id of ids) {
      const res = this.updateLCDScreen(id, { status });
      if (res.success) updatedCount++;
    }
    this.logAudit('Bulk Updated LCD Screen Status', 'lcd_screens', `${updatedCount} screens set to ${status}`);
    return { success: true, count: updatedCount };
  }

  // LCD Video Tracking
  public getLCDVideos(): LCDVideo[] {
    return this.lcdVideos;
  }

  public addLCDVideo(vid: Omit<LCDVideo, 'id' | 'createdAt' | 'videoId'>): { success: boolean; data?: LCDVideo; error?: string } {
    if (!this.hasPermission('lcd_videos', 'add')) {
      return { success: false, error: 'Permission denied: Cannot add LCD videos' };
    }
    const videoId = `VID-${Math.floor(100 + Math.random()*900)}`;
    const newVid: LCDVideo = {
      ...vid,
      id: `vid-${Date.now()}`,
      videoId,
      createdAt: new Date().toISOString()
    };
    this.lcdVideos.push(newVid);
    setDoc(doc(db, 'lcd_videos', newVid.id), sanitizeFirestoreData(newVid)).catch(e => console.error(e));

    this.logAudit('Submitted New LCD Video', 'lcd_videos', `${videoId} (${newVid.videoName})`, undefined, `Screen: ${newVid.screenName}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: newVid };
  }

  public updateLCDVideo(id: string, updates: Partial<LCDVideo>): { success: boolean; data?: LCDVideo; error?: string } {
    if (!this.hasPermission('lcd_videos', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update LCD videos' };
    }
    const idx = this.lcdVideos.findIndex(v => v.id === id);
    if (idx === -1) return { success: false, error: 'LCD video not found' };

    const oldVal = this.lcdVideos[idx];
    const updated = { ...oldVal, ...updates };
    this.lcdVideos[idx] = updated;
    setDoc(doc(db, 'lcd_videos', id), sanitizeFirestoreData(updated)).catch(e => console.error(e));

    this.logAudit('Updated LCD Video Status', 'lcd_videos', updated.videoId, `Status: ${oldVal.status}`, `Status: ${updated.status}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: updated };
  }

  public deleteLCDVideo(id: string): { success: boolean; error?: string } {
    if (!this.hasPermission('lcd_videos', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete LCD videos' };
    }
    const vid = this.lcdVideos.find(v => v.id === id);
    if (!vid) return { success: false, error: 'LCD Video not found' };

    this.lcdVideos = this.lcdVideos.filter(v => v.id !== id);
    deleteDoc(doc(db, 'lcd_videos', id)).catch(e => console.error(e));

    this.logAudit('Deleted LCD Video', 'lcd_videos', vid.videoId);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeleteLCDVideos(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('lcd_videos', 'delete')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot delete LCD videos' };
    }
    let deletedCount = 0;
    for (const id of ids) {
      const res = this.deleteLCDVideo(id);
      if (res.success) deletedCount++;
    }
    this.logAudit('Bulk Deleted LCD Videos', 'lcd_videos', `${deletedCount} videos deleted`);
    return { success: true, count: deletedCount };
  }

  public async bulkUpdateLCDVideoStatus(ids: string[], status: LCDVideo['status']): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('lcd_videos', 'update')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot update LCD videos' };
    }
    let updatedCount = 0;
    for (const id of ids) {
      const res = this.updateLCDVideo(id, { status });
      if (res.success) updatedCount++;
    }
    this.logAudit('Bulk Updated LCD Video Status', 'lcd_videos', `${updatedCount} videos set to ${status}`);
    return { success: true, count: updatedCount };
  }

  // Budget & Expenses
  public getBudgets(): Budget[] {
    return this.budgets;
  }

  public addBudget(bdg: Omit<Budget, 'id' | 'createdAt' | 'remaining' | 'warningLevel'>): { success: boolean; data?: Budget; error?: string } {
    if (!this.hasPermission('budget', 'add')) {
      return { success: false, error: 'Permission denied: Cannot add budget allocation' };
    }
    const remaining = bdg.allocated - bdg.committed - bdg.spent;
    const newBdg: Budget = {
      ...bdg,
      id: `bdg-${Date.now()}`,
      remaining,
      warningLevel: 'Normal',
      createdAt: new Date().toISOString()
    };
    this.budgets.push(newBdg);
    setDoc(doc(db, 'budgets', newBdg.id), sanitizeFirestoreData(newBdg)).catch(e => console.error(e));

    this.logAudit('Added Budget Allocation', 'budget', newBdg.budgetId, undefined, `Allocated: $${newBdg.allocated}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: newBdg };
  }

  public updateBudget(id: string, updates: Partial<Budget>): { success: boolean; data?: Budget; error?: string } {
    if (!this.hasPermission('budget', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update budget' };
    }
    const idx = this.budgets.findIndex(b => b.id === id);
    if (idx === -1) return { success: false, error: 'Budget not found' };

    const oldVal = this.budgets[idx];
    const updated = { ...oldVal, ...updates };
    this.budgets[idx] = updated;
    setDoc(doc(db, 'budgets', id), sanitizeFirestoreData(updated)).catch(e => console.error(e));

    this.logAudit('Updated Budget Allocation', 'budget', updated.budgetId, `Allocated: $${oldVal.allocated}`, `Allocated: $${updated.allocated}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: updated };
  }

  public deleteBudget(id: string): { success: boolean; error?: string } {
    if (!this.hasPermission('budget', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete budget allocation' };
    }
    const bdg = this.budgets.find(b => b.id === id);
    if (!bdg) return { success: false, error: 'Budget allocation not found' };

    this.budgets = this.budgets.filter(b => b.id !== id);
    deleteDoc(doc(db, 'budgets', id)).catch(e => console.error(e));

    this.logAudit('Deleted Budget Allocation', 'budget', bdg.budgetId);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public getExpenses(): Expense[] {
    return this.expenses;
  }

  public addExpense(exp: Omit<Expense, 'id' | 'createdAt' | 'expenseId'>): { success: boolean; data?: Expense; error?: string } {
    if (!this.hasPermission('expenses', 'add')) {
      return { success: false, error: 'Permission denied: Cannot add expense' };
    }
    const expenseId = `EXP-${Math.floor(100 + Math.random()*900)}`;
    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      expenseId,
      createdAt: new Date().toISOString()
    };
    this.expenses.push(newExp);
    setDoc(doc(db, 'expenses', newExp.id), sanitizeFirestoreData(newExp)).catch(e => console.error(e));

    if (newExp.paymentStatus === 'Approved' || newExp.paymentStatus === 'Paid') {
      const bIdx = this.budgets.findIndex(b => b.category === newExp.category && b.budgetType === newExp.budgetType);
      if (bIdx !== -1) {
        this.budgets[bIdx].spent += newExp.amount;
        setDoc(doc(db, 'budgets', this.budgets[bIdx].id), sanitizeFirestoreData(this.budgets[bIdx])).catch(e => console.error(e));
      }
    }

    const newPay: CentralPayment = {
      id: `pay-${Date.now()}`,
      paymentId: expenseId,
      paymentType: 'Other Marketing Expense',
      recipient: newExp.requestedBy,
      reference: expenseId,
      amount: newExp.amount,
      currency: newExp.currency,
      dueDate: newExp.date,
      status: newExp.paymentStatus,
      relatedEntityId: newExp.id,
      budgetType: newExp.budgetType,
      notes: newExp.description,
      createdAt: new Date().toISOString()
    };
    this.payments.push(newPay);
    setDoc(doc(db, 'payments', newPay.id), sanitizeFirestoreData(newPay)).catch(e => console.error(e));

    this.logAudit('Recorded Marketing Expense', 'expenses', expenseId, undefined, `Amount: $${newExp.amount}, Category: ${newExp.category}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: newExp };
  }

  public updateExpense(id: string, updates: Partial<Expense>): { success: boolean; data?: Expense; error?: string } {
    if (!this.hasPermission('expenses', 'update')) {
      return { success: false, error: 'Permission denied: Cannot update expense' };
    }
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, error: 'Expense not found' };

    const oldVal = this.expenses[idx];
    const updated = { ...oldVal, ...updates };
    this.expenses[idx] = updated;
    setDoc(doc(db, 'expenses', id), sanitizeFirestoreData(updated)).catch(e => console.error(e));

    if (oldVal.paymentStatus !== updated.paymentStatus && (updated.paymentStatus === 'Approved' || updated.paymentStatus === 'Paid')) {
      const bIdx = this.budgets.findIndex(b => b.category === updated.category && b.budgetType === updated.budgetType);
      if (bIdx !== -1) {
        this.budgets[bIdx].spent += updated.amount;
        setDoc(doc(db, 'budgets', this.budgets[bIdx].id), sanitizeFirestoreData(this.budgets[bIdx])).catch(e => console.error(e));
      }
    }

    this.logAudit('Updated Expense Record', 'expenses', updated.expenseId, `Status: ${oldVal.paymentStatus}`, `Status: ${updated.paymentStatus}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: updated };
  }

  public deleteExpense(id: string): { success: boolean; error?: string } {
    if (!this.hasPermission('expenses', 'delete')) {
      return { success: false, error: 'Permission denied: Cannot delete expense' };
    }
    const exp = this.expenses.find(e => e.id === id);
    if (!exp) return { success: false, error: 'Expense not found' };

    this.expenses = this.expenses.filter(e => e.id !== id);
    deleteDoc(doc(db, 'expenses', id)).catch(e => console.error(e));

    const toRemovePays = this.payments.filter(p => p.relatedEntityId === id || p.reference === exp.expenseId);
    this.payments = this.payments.filter(p => p.relatedEntityId !== id && p.reference !== exp.expenseId);
    toRemovePays.forEach(p => deleteDoc(doc(db, 'payments', p.id)).catch(e => console.error(e)));

    this.logAudit('Deleted Expense Record', 'expenses', exp.expenseId);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeleteExpenses(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('expenses', 'delete')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot delete expense' };
    }
    let deletedCount = 0;
    for (const id of ids) {
      const res = this.deleteExpense(id);
      if (res.success) deletedCount++;
    }
    this.logAudit('Bulk Deleted Expenses', 'expenses', `${deletedCount} expense records deleted`);
    return { success: true, count: deletedCount };
  }

  public async bulkUpdateExpenseStatus(ids: string[], paymentStatus: Expense['paymentStatus']): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.hasPermission('expenses', 'update')) {
      return { success: false, count: 0, error: 'Permission denied: Cannot update expense' };
    }
    let updatedCount = 0;
    for (const id of ids) {
      const res = this.updateExpense(id, { paymentStatus });
      if (res.success) updatedCount++;
    }
    this.logAudit('Bulk Updated Expense Status', 'expenses', `${updatedCount} records set to ${paymentStatus}`);
    return { success: true, count: updatedCount };
  }

  // Central Payments Management
  public getPayments(): CentralPayment[] {
    return this.payments;
  }

  public updatePaymentStatus(id: string, newStatus: CentralPayment['status'], method?: string, ref?: string): { success: boolean; data?: CentralPayment; error?: string } {
    const isApprove = newStatus === 'Approved' || newStatus === 'Paid';
    if (isApprove && !this.hasPermission('influencer_payments', 'approve') && !this.hasPermission('billboard_payments', 'approve') && !this.hasPermission('lcd_payments', 'approve') && !this.hasPermission('expenses', 'approve')) {
      return { success: false, error: 'Permission denied: You do not have Approval authority for payments' };
    }

    const idx = this.payments.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'Payment not found' };

    const oldP = this.payments[idx];
    this.payments[idx].status = newStatus;
    if (newStatus === 'Paid') {
      this.payments[idx].paymentDate = new Date().toISOString().split('T')[0];
      if (method) this.payments[idx].paymentMethod = method;
      if (ref) this.payments[idx].paymentReference = ref;
    }

    setDoc(doc(db, 'payments', id), sanitizeFirestoreData(this.payments[idx])).catch(e => console.error(e));

    if (oldP.relatedEntityId) {
      const delIdx = this.deliveries.findIndex(d => d.id === oldP.relatedEntityId);
      if (delIdx !== -1) {
        this.deliveries[delIdx].paymentStatus = newStatus;
        if (newStatus === 'Paid') {
          this.deliveries[delIdx].paymentDate = this.payments[idx].paymentDate;
          this.deliveries[delIdx].paymentReference = this.payments[idx].paymentReference;
        }
        setDoc(doc(db, 'deliveries', this.deliveries[delIdx].id), sanitizeFirestoreData(this.deliveries[delIdx])).catch(e => console.error(e));
      }

      const expIdx = this.expenses.findIndex(e => e.id === oldP.relatedEntityId);
      if (expIdx !== -1) {
        this.expenses[expIdx].paymentStatus = newStatus;
        setDoc(doc(db, 'expenses', this.expenses[expIdx].id), sanitizeFirestoreData(this.expenses[expIdx])).catch(e => console.error(e));
      }
    }

    this.logAudit('Updated Central Payment Status', 'influencer_payments', oldP.reference, `Status: ${oldP.status}`, `Status: ${newStatus}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true, data: this.payments[idx] };
  }

  public async deletePayment(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.hasPermission('influencer_payments', 'approve') && !this.hasPermission('billboard_payments', 'approve')) {
      return { success: false, error: 'Permission denied: Cannot delete payments' };
    }
    const idx = this.payments.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'Payment record not found' };
    const p = this.payments[idx];
    this.payments.splice(idx, 1);
    await deleteDoc(doc(db, 'payments', id)).catch(e => console.error(e));
    this.logAudit('Deleted Payment Record', 'influencer_payments', p.paymentId, `Amount: $${p.amount}`);
    this.recalculateAll();
    this.notifyListeners();
    return { success: true };
  }

  public async bulkDeletePayments(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    let count = 0;
    for (const id of ids) {
      const res = await this.deletePayment(id);
      if (res.success) count++;
    }
    return { success: true, count };
  }

  public async bulkUpdatePaymentStatus(ids: string[], nextStatus: CentralPaymentStatus): Promise<{ success: boolean; count: number; error?: string }> {
    let count = 0;
    for (const id of ids) {
      const res = await this.updatePaymentStatus(id, nextStatus);
      if (res.success) count++;
    }
    return { success: true, count };
  }

  // Audit Logs & Alerts
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public getAlerts(): AlertItem[] {
    const alerts: AlertItem[] = [];
    const todayStr = '2026-08-27';
    const today = new Date(todayStr);

    this.targets.forEach(t => {
      if (t.status === 'Below Target') {
        alerts.push({
          id: `alt-inf-trg-${t.id}`,
          type: 'warning',
          module: 'Influencers',
          title: `Influencer Below Target: ${t.influencerName}`,
          message: `${t.completedVideos}/${t.targetVideos} videos completed (${t.achievementPercent}% achievement)`,
          actionUrl: '/influencers/targets',
          date: t.updatedAt ? t.updatedAt.split('T')[0] : todayStr,
        });
      }
    });

    this.influencers.forEach(i => {
      if (i.status === 'Active' && i.agreementEnd) {
        const endDate = new Date(i.agreementEnd);
        const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
          alerts.push({
            id: `alt-inf-exp-${i.id}`,
            type: diffDays <= 2 ? 'danger' : 'warning',
            module: 'Influencers',
            title: `Agreement Expiring Soon: ${i.fullName}`,
            message: `Contract ends on ${i.agreementEnd} (${diffDays} days remaining)`,
            actionUrl: `/influencers/${i.id}`,
            date: todayStr,
          });
        }
      }
    });

    this.deliveries.forEach(d => {
      if (d.paymentStatus === 'Unpaid') {
        alerts.push({
          id: `alt-del-unpaid-${d.id}`,
          type: 'danger',
          module: 'Deliveries',
          title: `Unpaid Delivery: ${d.deliveryId}`,
          message: `${d.influencerName} - ${d.product} ($${d.totalPrice})`,
          actionUrl: '/influencers/deliveries',
          date: d.date,
        });
      }
    });

    this.billboards.forEach(b => {
      if (b.status === 'Active' && b.agreementEnd) {
        const endDate = new Date(b.agreementEnd);
        const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          alerts.push({
            id: `alt-bb-exp-${b.id}`,
            type: diffDays <= 10 ? 'danger' : 'warning',
            module: 'Billboards',
            title: `Billboard Expiring: ${b.billboardId}`,
            message: `${b.location} contract expires in ${diffDays} days (${b.agreementEnd})`,
            actionUrl: '/billboards/all',
            date: todayStr,
          });
        }
      }
    });

    this.lcdScreens.forEach(l => {
      if (l.status === 'Active' && l.agreementEnd) {
        const endDate = new Date(l.agreementEnd);
        const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          alerts.push({
            id: `alt-lcd-exp-${l.id}`,
            type: diffDays <= 7 ? 'danger' : 'warning',
            module: 'LCD Screens',
            title: `LCD Contract Expiring: ${l.screenId}`,
            message: `${l.screenName} contract expires in ${diffDays} days`,
            actionUrl: '/lcd-screens/all',
            date: todayStr,
          });
        }
      }
    });

    this.budgets.forEach(b => {
      if (b.warningLevel === 'Warning') {
        alerts.push({
          id: `alt-bdg-warn-${b.id}`,
          type: 'warning',
          module: 'Budget',
          title: `Budget Warning (80%): ${b.budgetType} ${b.category}`,
          message: `$${b.spent + b.committed} used of $${b.allocated} allocated ($${b.remaining} remaining)`,
          actionUrl: '/budget/expenses',
          date: todayStr,
        });
      } else if (b.warningLevel === 'Critical' || b.warningLevel === 'Exceeded') {
        alerts.push({
          id: `alt-bdg-crit-${b.id}`,
          type: 'danger',
          module: 'Budget',
          title: `Critical Budget Alert (${b.warningLevel}): ${b.budgetType} ${b.category}`,
          message: `$${b.spent + b.committed} used of $${b.allocated} allocated ($${b.remaining} remaining)`,
          actionUrl: '/budget/expenses',
          date: todayStr,
        });
      }
    });

    return alerts;
  }
}

export const store = new StoreService();
