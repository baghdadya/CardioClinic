import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, UserPlus, Pencil, UserX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { User, UserRole } from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-50 text-purple-700",
  doctor: "bg-blue-50 text-blue-700",
  nurse: "bg-emerald-50 text-emerald-700",
  receptionist: "bg-amber-50 text-amber-700",
};

const roleOptions = [
  { value: "admin", label: "Global Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "receptionist", label: "Receptionist" },
];

const emptyAddForm = {
  full_name: "",
  email: "",
  password: "",
  role: "nurse" as UserRole,
};

export default function UsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Edit dialog
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", role: "" as UserRole, is_active: true, password: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Deactivate confirmation
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<User[]>("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Add User ---
  const handleAdd = async () => {
    const errors: Record<string, string> = {};
    if (!addForm.full_name.trim()) errors.full_name = "Name is required";
    if (!addForm.email.trim()) errors.email = "Email is required";
    if (!addForm.password.trim()) errors.password = "Password is required";
    if (Object.keys(errors).length) {
      setAddErrors(errors);
      return;
    }
    setAddErrors({});
    setAddSubmitting(true);
    try {
      await api.post("/users", addForm);
      toast({ variant: "success", title: "User created successfully" });
      setShowAddDialog(false);
      setAddForm(emptyAddForm);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create user";
      toast({ variant: "error", title: msg });
    } finally {
      setAddSubmitting(false);
    }
  };

  // --- Edit User ---
  const openEditDialog = (user: User) => {
    setEditUser(user);
    setEditForm({ full_name: user.full_name, email: user.email, role: user.role, is_active: user.is_active, password: "" });
    setEditErrors({});
  };

  const handleEdit = async () => {
    if (!editUser) return;
    const errors: Record<string, string> = {};
    if (!editForm.full_name.trim()) errors.full_name = "Name is required";
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});
    setEditSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editForm.full_name !== editUser.full_name) payload.full_name = editForm.full_name;
      if (editForm.email !== editUser.email) payload.email = editForm.email;
      if (editForm.role !== editUser.role) payload.role = editForm.role;
      if (editForm.is_active !== editUser.is_active) payload.is_active = editForm.is_active;
      if (editForm.password.trim()) payload.password = editForm.password.trim();
      if (Object.keys(payload).length === 0) {
        setEditUser(null);
        return;
      }
      await api.patch(`/users/${editUser.id}`, payload);
      toast({ variant: "success", title: "User updated successfully" });
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } } };
      const msg = errObj?.response?.data?.detail ?? "Failed to update user";
      toast({ variant: "error", title: msg });
    } finally {
      setEditSubmitting(false);
    }
  };

  // --- Delete User ---
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeletingUser(true);
    try {
      await api.delete(`/users/${deleteUser.id}`);
      toast({ variant: "success", title: "User deleted" });
      setDeleteUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } } };
      const msg = errObj?.response?.data?.detail ?? "Failed to delete user";
      toast({ variant: "error", title: msg });
    } finally {
      setDeletingUser(false);
    }
  };

  // --- Deactivate User ---
  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    setDeactivating(true);
    try {
      await api.patch(`/users/${deactivateUser.id}`, { is_active: false });
      toast({ variant: "success", title: "User deactivated" });
      setDeactivateUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to deactivate user";
      toast({ variant: "error", title: msg });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 && "s"} total
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus size={18} />
          Add User
        </Button>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-44" />
                <Skeleton className="ml-auto h-4 w-20" />
                <Skeleton className="hidden h-4 w-16 sm:block" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShieldCheck size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No users found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first user to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {user.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {user.full_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground sm:hidden">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          roleColors[user.role]
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <Badge variant={user.is_active ? "success" : "destructive"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                        {user.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeactivateUser(user)}
                            className="text-amber-600 hover:text-amber-700"
                            title="Deactivate"
                          >
                            <UserX size={14} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>Create a new staff account</DialogDescription>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={addForm.full_name}
              onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
              error={addErrors.full_name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="user@example.com"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              error={addErrors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              error={addErrors.password}
            />
            <Select
              label="Role"
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
              options={roleOptions}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button loading={addSubmitting} onClick={handleAdd}>
            Create User
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details for {editUser?.full_name}
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              error={editErrors.full_name}
            />
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Leave blank to keep current password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
            <Select
              label="Role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              options={roleOptions}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">Active</label>
              <button
                type="button"
                role="switch"
                aria-checked={editForm.is_active}
                onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  editForm.is_active ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                    editForm.is_active ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {editForm.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setEditUser(null)}>
            Cancel
          </Button>
          <Button loading={editSubmitting} onClick={handleEdit}>
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={!!deactivateUser} onClose={() => setDeactivateUser(null)}>
        <DialogHeader>
          <DialogTitle>Deactivate User</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate{" "}
            <span className="font-semibold text-foreground">{deactivateUser?.full_name}</span>?
            They will no longer be able to log in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDeactivateUser(null)}>
            Cancel
          </Button>
          <Button variant="destructive" loading={deactivating} onClick={handleDeactivate}>
            Deactivate
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deleteUser} onClose={() => { if (!deletingUser) setDeleteUser(null); }}>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-foreground">{deleteUser?.full_name}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDeleteUser(null)} disabled={deletingUser}>
            Cancel
          </Button>
          <Button variant="destructive" loading={deletingUser} onClick={handleDeleteUser}>
            Delete Permanently
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
