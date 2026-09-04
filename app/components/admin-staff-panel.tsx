"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADMIN_PERMISSION_META,
  ADMIN_ROLES,
  ROLE_DEFAULT_PERMISSIONS,
  canChangeStaffPassword,
  type AdminPermission,
  type AdminRole,
  roleLabel,
} from "@/lib/admin-permissions";

type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  permissions: AdminPermission[];
  permissionOverrides: AdminPermission[] | null;
  usesRoleDefaults: boolean;
};

export function AdminStaffPanel({
  initialUsers,
  actorId,
  actorRole,
}: {
  initialUsers: StaffUser[];
  actorId: string;
  actorRole: AdminRole;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: ADMIN_ROLES.employee as AdminRole,
    useRoleDefaults: true,
    permissions: [...ROLE_DEFAULT_PERMISSIONS.employee] as AdminPermission[],
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(
    () => users.find((user) => user.id === editingId) ?? null,
    [users, editingId],
  );
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: ADMIN_ROLES.employee as AdminRole,
    active: true,
    useRoleDefaults: true,
    permissions: [] as AdminPermission[],
  });

  function onRoleChange(
    role: AdminRole,
    setForm: typeof setCreateForm,
    current: typeof createForm,
  ) {
    setForm({
      ...current,
      role,
      permissions: [...ROLE_DEFAULT_PERMISSIONS[role]],
      useRoleDefaults: true,
    });
  }

  function togglePermission(
    permission: AdminPermission,
    selected: AdminPermission[],
    onChange: (next: AdminPermission[]) => void,
  ) {
    if (selected.includes(permission)) {
      onChange(selected.filter((item) => item !== permission));
    } else {
      onChange([...selected, permission]);
    }
  }

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          useRoleDefaults: createForm.useRoleDefaults,
          permissions: createForm.useRoleDefaults ? null : createForm.permissions,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        return;
      }
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: ADMIN_ROLES.employee,
        useRoleDefaults: true,
        permissions: [...ROLE_DEFAULT_PERMISSIONS.employee],
      });
      router.refresh();
      const list = await fetch("/api/admin/staff").then((r) => r.json());
      if (list.users) setUsers(list.users);
    } catch {
      setError("Unable to create account.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user: StaffUser) {
    setEditingId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      active: user.active,
      useRoleDefaults: user.usesRoleDefaults,
      permissions: user.usesRoleDefaults
        ? [...ROLE_DEFAULT_PERMISSIONS[user.role]]
        : [...user.permissions],
    });
    setError("");
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/staff/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          password:
            editing &&
            !canChangeStaffPassword(actorRole, editing.role)
              ? undefined
              : editForm.password || undefined,
          role: editForm.role,
          active: editForm.active,
          useRoleDefaults: editForm.useRoleDefaults,
          permissions: editForm.useRoleDefaults ? null : editForm.permissions,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to update account.");
        return;
      }
      setEditingId(null);
      router.refresh();
      const list = await fetch("/api/admin/staff").then((r) => r.json());
      if (list.users) setUsers(list.users);
    } catch {
      setError("Unable to update account.");
    } finally {
      setSaving(false);
    }
  }

  const canAssignMaster = actorRole === ADMIN_ROLES.master;

  return (
    <div className="mt-10 space-y-10">
      {error && (
        <p className="rounded-sm border border-brand/30 bg-pink-soft px-4 py-3 text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-2xl text-plum">Create staff account</h2>
        <p className="mt-2 text-sm text-muted">
          Fill in name, email, a temporary password, and a role, then press{" "}
          <span className="font-semibold text-plum">Save staff account</span>.
          You can customise access before saving.
        </p>

        <form onSubmit={createUser} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Temporary password">
            <input
              required
              type="password"
              minLength={8}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Role">
            <select
              value={createForm.role}
              onChange={(e) =>
                onRoleChange(e.target.value as AdminRole, setCreateForm, createForm)
              }
              className={inputClass}
            >
              {canAssignMaster && (
                <option value={ADMIN_ROLES.master}>{roleLabel(ADMIN_ROLES.master)}</option>
              )}
              <option value={ADMIN_ROLES.director}>{roleLabel(ADMIN_ROLES.director)}</option>
              <option value={ADMIN_ROLES.employee}>{roleLabel(ADMIN_ROLES.employee)}</option>
            </select>
          </Field>

          {createForm.role !== ADMIN_ROLES.master && (
            <div className="sm:col-span-2">
              <PermissionEditor
                useRoleDefaults={createForm.useRoleDefaults}
                permissions={createForm.permissions}
                onUseDefaultsChange={(useRoleDefaults) =>
                  setCreateForm({
                    ...createForm,
                    useRoleDefaults,
                    permissions: useRoleDefaults
                      ? [...ROLE_DEFAULT_PERMISSIONS[createForm.role]]
                      : createForm.permissions,
                  })
                }
                onToggle={(permission) =>
                  togglePermission(permission, createForm.permissions, (permissions) =>
                    setCreateForm({
                      ...createForm,
                      useRoleDefaults: false,
                      permissions,
                    }),
                  )
                }
              />
            </div>
          )}

          <div className="sticky bottom-4 z-10 sm:col-span-2">
            <div className="flex flex-col gap-3 rounded-sm border border-sage/40 bg-sage-light/95 px-4 py-3 shadow-md backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-plum">
                Name, email, temporary password, and role are required.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save staff account"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-2xl text-plum">Staff</h2>
        <ul className="mt-6 divide-y divide-plum/10">
          {users.map((user) => (
            <li key={user.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-plum">
                    {user.name}
                    {!user.active && (
                      <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-brand">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted">
                    {user.email} · {roleLabel(user.role)}
                    {user.usesRoleDefaults ? " · role defaults" : " · custom access"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {user.permissions.join(", ") || "No permissions"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(user)}
                  className="rounded-sm border border-plum/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink hover:text-brand"
                >
                  Edit
                </button>
              </div>

              {editing?.id === user.id && (
                <form onSubmit={saveEdit} className="mt-4 grid gap-4 rounded-sm border border-plum/10 bg-cream/40 p-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  {canChangeStaffPassword(actorRole, user.role) && (
                    <Field label="New password (optional)">
                      <input
                        type="password"
                        minLength={8}
                        value={editForm.password}
                        onChange={(e) =>
                          setEditForm({ ...editForm, password: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  )}
                  <Field label="Role">
                    <select
                      value={editForm.role}
                      onChange={(e) => {
                        const role = e.target.value as AdminRole;
                        setEditForm({
                          ...editForm,
                          role,
                          useRoleDefaults: true,
                          permissions: [...ROLE_DEFAULT_PERMISSIONS[role]],
                        });
                      }}
                      className={inputClass}
                      disabled={user.id === actorId && user.role === ADMIN_ROLES.master}
                    >
                      {canAssignMaster && (
                        <option value={ADMIN_ROLES.master}>
                          {roleLabel(ADMIN_ROLES.master)}
                        </option>
                      )}
                      <option value={ADMIN_ROLES.director}>
                        {roleLabel(ADMIN_ROLES.director)}
                      </option>
                      <option value={ADMIN_ROLES.employee}>
                        {roleLabel(ADMIN_ROLES.employee)}
                      </option>
                    </select>
                  </Field>

                  <label className="flex items-center gap-2 text-sm text-plum sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(e) =>
                        setEditForm({ ...editForm, active: e.target.checked })
                      }
                      disabled={user.id === actorId}
                    />
                    Active account
                  </label>

                  {editForm.role !== ADMIN_ROLES.master && (
                    <div className="sm:col-span-2">
                      <PermissionEditor
                        useRoleDefaults={editForm.useRoleDefaults}
                        permissions={editForm.permissions}
                        onUseDefaultsChange={(useRoleDefaults) =>
                          setEditForm({
                            ...editForm,
                            useRoleDefaults,
                            permissions: useRoleDefaults
                              ? [...ROLE_DEFAULT_PERMISSIONS[editForm.role]]
                              : editForm.permissions,
                          })
                        }
                        onToggle={(permission) =>
                          togglePermission(
                            permission,
                            editForm.permissions,
                            (permissions) =>
                              setEditForm({
                                ...editForm,
                                useRoleDefaults: false,
                                permissions,
                              }),
                          )
                        }
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-sm bg-sage px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-sm border border-plum/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-plum"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PermissionEditor({
  useRoleDefaults,
  permissions,
  onUseDefaultsChange,
  onToggle,
}: {
  useRoleDefaults: boolean;
  permissions: AdminPermission[];
  onUseDefaultsChange: (value: boolean) => void;
  onToggle: (permission: AdminPermission) => void;
}) {
  return (
    <div className="rounded-sm border border-plum/10 bg-white p-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-plum">
        <input
          type="checkbox"
          checked={useRoleDefaults}
          onChange={(e) => onUseDefaultsChange(e.target.checked)}
        />
        Use role default access
      </label>
      <p className="mt-2 text-xs text-muted">
        Untick to customise. Master always has full access.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ADMIN_PERMISSION_META.map((item) => (
          <label key={item.id} className="flex items-start gap-2 text-sm text-plum">
            <input
              type="checkbox"
              className="mt-1"
              checked={permissions.includes(item.id)}
              disabled={useRoleDefaults}
              onChange={() => onToggle(item.id)}
            />
            <span>
              <span className="font-semibold">{item.label}</span>
              <span className="block text-xs text-muted">{item.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-plum">
      {label}
      <div className="mt-2 font-normal">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1";
