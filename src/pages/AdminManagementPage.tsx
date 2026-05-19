import { useState } from "react";
import { Plus } from "lucide-react";
import AdminList from "@/features/admins/components/AdminList";
import CreateAdminModal from "@/features/admins/components/CreateAdminModal";
import EditAdminModal from "@/features/admins/components/EditAdminModal";
import { Button } from "@/components/ui/Button";
import type { AdminAccount } from "@/types/api";

export default function AdminManagementPage() {
  // ── Create modal state ──────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);

  // ── Edit modal state ────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);

  /* ---- Callbacks ---- */

  function handleEdit(admin: AdminAccount) {
    setEditingAdmin(admin);
    setEditOpen(true);
  }

  function handleEditClose() {
    setEditOpen(false);
    setEditingAdmin(null);
  }

  return (
    <div>
      {/* ─── Page header ────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage admin accounts and permissions.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Admin
        </Button>
      </div>

      {/* ─── Admin list ─────────────────────────────────────────── */}
      <AdminList onEdit={handleEdit} />

      {/* ─── Modals ─────────────────────────────────────────────── */}
      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {editingAdmin && (
        <EditAdminModal
          open={editOpen}
          admin={editingAdmin}
          onClose={handleEditClose}
        />
      )}
    </div>
  );
}
