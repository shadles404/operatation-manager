import React, { useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Search,
  Key,
  Edit2,
  Trash2,
  Lock,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';
import { store } from '../../services/store';
import { User, UserRole, UserStatus, UserPermissions, PermissionModule } from '../../types';

const MODULE_DEFINITIONS: { id: PermissionModule; label: string; actions: string[] }[] = [
  { id: 'influencers', label: 'Influencers', actions: ['view', 'add', 'update', 'delete', 'export'] },
  { id: 'targets', label: 'Target Tracking', actions: ['view', 'update'] },
  { id: 'deliveries', label: 'Delivery Records', actions: ['view', 'add', 'update', 'delete', 'export'] },
  { id: 'billboards', label: 'Billboards', actions: ['view', 'add', 'update', 'delete', 'export'] },
  { id: 'lcd_screens', label: 'LCD Screens', actions: ['view', 'add', 'update', 'delete', 'export'] },
  { id: 'lcd_videos', label: 'LCD Videos', actions: ['view', 'add', 'update', 'delete'] },
  { id: 'budget', label: 'Budget & Expenses', actions: ['view', 'add', 'update', 'export'] },
  { id: 'influencer_payments', label: 'Influencer Payments', actions: ['view', 'approve', 'update', 'export'] },
  { id: 'billboard_payments', label: 'Billboard Payments', actions: ['view', 'approve', 'update'] },
  { id: 'lcd_payments', label: 'LCD Payments', actions: ['view', 'approve', 'update'] },
  { id: 'reports', label: 'Reports & Analytics', actions: ['view', 'export'] },
  { id: 'users', label: 'User Management', actions: ['view', 'add', 'update', 'delete'] },
];

export const UsersView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('password123');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [initialPassword, setInitialPassword] = useState('password123');
  const [phone, setPhone] = useState('+252 61 500 0000');
  const [role, setRole] = useState<UserRole>('subuser');
  const [status, setStatus] = useState<UserStatus>('active');
  const [permissions, setPermissions] = useState<UserPermissions>(store.getInitialSubUserPermissions());

  const users = store.getUsers();
  const currentUser = store.getCurrentUser();
  const canManageUsers = store.hasPermission('users', 'update');
  const canAddUsers = store.hasPermission('users', 'add');
  const canDeleteUsers = store.hasPermission('users', 'delete');

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = filtered.length > 0 && filtered.every(u => selectedIds.includes(u.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(u => u.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteOne = async (id: string, name: string) => {
    if (!canDeleteUsers) {
      setPermissionError('Permission denied: Admin authority required to delete user accounts');
      return;
    }
    if (confirm(`Are you sure you want to delete user account "${name}"?`)) {
      const res = await store.deleteUser(id);
      if (!res.success) {
        setPermissionError(res.error || 'Failed to delete user account');
      } else {
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!canDeleteUsers) return;
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected user account(s)?`)) {
      const res = await store.bulkDeleteUsers(selectedIds);
      if (res.success) {
        setSelectedIds([]);
      } else {
        setPermissionError(res.error || 'Failed to bulk delete users');
      }
    }
  };

  const handleBulkStatus = async (newStatus: UserStatus) => {
    if (!canManageUsers) return;
    if (selectedIds.length === 0) return;
    const res = await store.bulkUpdateUserStatus(selectedIds, newStatus);
    if (!res.success) {
      setPermissionError(res.error || 'Failed to bulk update user status');
    }
  };

  const handleOpenAdd = () => {
    if (!canAddUsers) {
      setPermissionError('Permission denied: Admin authority required to register sub-users');
      return;
    }
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setInitialPassword('password123');
    setPhone('+252 61 500 0000');
    setRole('subuser');
    setStatus('active');
    setPermissions(store.getInitialSubUserPermissions());
    setPermissionError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    if (!canManageUsers) {
      setPermissionError('Permission denied: Admin authority required to edit user permissions');
      return;
    }
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setStatus(user.status);
    setPermissions(user.permissions || store.getInitialSubUserPermissions());
    setPermissionError(null);
    setIsFormOpen(true);
  };

  const handleTogglePermission = (moduleKey: PermissionModule, actionKey: string) => {
    setPermissions(prev => {
      const modulePerms = { ...(prev[moduleKey] || {}) } as any;
      modulePerms[actionKey] = !modulePerms[actionKey];
      return {
        ...prev,
        [moduleKey]: modulePerms
      };
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setPermissionError(null);
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const res = await store.updateUser(editingUser.id, {
          fullName,
          username,
          email,
          phone,
          role,
          status,
          permissions
        });
        setIsSubmitting(false);
        if (res.success) {
          setIsFormOpen(false);
        } else {
          setPermissionError(res.error || 'Failed to update user profile');
        }
      } else {
        const res = await store.addUser({
          fullName,
          username,
          email,
          phone,
          role,
          status,
          permissions
        }, initialPassword);
        setIsSubmitting(false);
        if (res.success) {
          setIsFormOpen(false);
        } else {
          setPermissionError(res.error || 'Failed to create sub-user credentials in Firebase');
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setPermissionError(err.message || 'An error occurred while saving user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    const res = await store.adminResetPassword(resetPassUser.id, newPasswordInput);
    if (res.success) {
      setResetPassUser(null);
      alert(`Password reset request logged for ${resetPassUser.fullName}. User may update password in Profile.`);
    } else {
      setPermissionError(res.error || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (!canManageUsers) return;
    const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    await store.updateUser(user.id, { status: nextStatus });
  };

  const handleDeleteUser = async (user: User) => {
    if (!canDeleteUsers) return;
    if (user.role === 'admin') {
      alert('Cannot delete the primary System Administrator account.');
      return;
    }
    if (confirm(`Are you sure you want to delete sub-user ${user.fullName}?`)) {
      const res = await store.deleteUser(user.id);
      if (!res.success) {
        setPermissionError(res.error || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Firebase User Accounts & Granular RBAC Permissions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Control module-by-module & action-by-action access backed by Firebase Authentication</p>
        </div>

        {canAddUsers && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sub-User Account</span>
          </button>
        )}
      </div>

      {permissionError && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>{selectedIds.length} user account(s) selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManageUsers && (
              <>
                <button
                  onClick={() => handleBulkStatus('active')}
                  className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Set Active</span>
                </button>
                <button
                  onClick={() => handleBulkStatus('inactive')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Set Inactive</span>
                </button>
              </>
            )}
            {canDeleteUsers && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Bulk Delete ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* User List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>System User Accounts ({users.length})</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user name, email, role..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-10">
                  <button 
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">User Profile</th>
                <th className="py-3 px-4 font-semibold">Username / Auth UID</th>
                <th className="py-3 px-4 font-semibold text-center">Role</th>
                <th className="py-3 px-4 font-semibold text-center">Last Active</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(u => {
                const isSelected = selectedIds.includes(u.id);
                return (
                  <tr key={u.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-amber-500/5' : ''}`}>
                    <td className="py-3.5 px-4">
                      <button 
                        onClick={() => handleSelectOne(u.id)}
                        className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">{u.username}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Active'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={!canManageUsers || u.role === 'admin'}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-rose-950 hover:text-rose-300'
                          : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-emerald-950 hover:text-emerald-300'
                      }`}
                    >
                      {u.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                      <span>{u.status}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canManageUsers && (
                        <button
                          onClick={() => setResetPassUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}

                      {canManageUsers && (
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                          title="Edit Permissions"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {canDeleteUsers && u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form & Granular Permissions Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
            <h3 className="text-base font-bold text-white mb-1">
              {editingUser ? `Edit Account & Permissions: ${editingUser.fullName}` : 'Create New Sub-User Account'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">Assign specific operational actions in Firebase Authentication & Firestore</p>

            <form onSubmit={handleSaveUser} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Hassan Nur"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="hassan"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="hassan@company.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Firebase Initial Password * (min 6 chars)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={initialPassword}
                      onChange={e => setInitialPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role Type</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold"
                  >
                    <option value="subuser">Sub-User (Custom Permissions)</option>
                    <option value="admin">Marketing Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Granular Permission Checkboxes Matrix */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-4">
                <div className="font-bold text-white text-sm flex items-center justify-between">
                  <span>Granular Module Action Matrix</span>
                  <span className="text-[11px] text-amber-400 font-normal">Check allowed actions for this sub-user</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MODULE_DEFINITIONS.map(mod => {
                    const currentPerms = permissions[mod.id] || {};
                    return (
                      <div key={mod.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <div className="font-semibold text-amber-300">{mod.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {mod.actions.map(act => {
                            const isChecked = !!(currentPerms as any)[act];
                            return (
                              <button
                                key={act}
                                type="button"
                                onClick={() => handleTogglePermission(mod.id, act)}
                                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                                  isChecked
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-amber-400' : 'bg-slate-600'}`} />
                                <span className="capitalize">{act}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Account...</span>
                    </>
                  ) : (
                    <span>Save User Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Reset Password: {resetPassUser.fullName}</h3>
            <p className="text-xs text-slate-400 mb-4">Set a temporary new password for this account</p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
