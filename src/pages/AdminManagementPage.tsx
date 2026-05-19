import { useState } from "react";
import { Plus } from "lucide-react";
import AdminList from "@/features/admins/components/AdminList";
import CreateAdminModal from "@/features/admins/components/CreateAdminModal";
import EditAdminModal from "@/features/admins/components/EditAdminModal";
import DeactivateConfirmModal from "@/features/admins/components/DeactivateConfirmModal";
import { Button } from "@/components/ui/Button";
import type { AdminAccount } from "@/types/api";

export default function AdminManagementPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatingAdmin, setDeactivatingAdmin] =
    useState<AdminAccount | null>(null);

  function handleEdit(admin: AdminAccount) {
    setEditingAdmin(admin);
    setEditOpen(true);
  }

  function handleEditClose() {
    setEditOpen(false);
    setEditingAdmin(null);
  }

  function handleDeactivateRequest(admin: AdminAccount) {
    setDeactivatingAdmin(admin);
    setDeactivateOpen(true);
  }

  function handleDeactivateClose() {
    setDeactivateOpen(false);
    setDeactivatingAdmin(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage admin accounts and permissions.
          </p>
        </div>
        <Button onClick={() => { console.log("Create Admin button clicked"); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />
          Create Admin
        </Button>
      </div>

      <AdminList onEdit={handleEdit} onDeactivate={handleDeactivateRequest} />

      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {editingAdmin && (
        <EditAdminModal
          open={editOpen}
          admin={editingAdmin}
          onClose={handleEditClose}
          onDeactivate={handleDeactivateRequest}
        />
      )}

      {deactivatingAdmin && (
        <DeactivateConfirmModal
          open={deactivateOpen}
          admin={deactivatingAdmin}
          onClose={handleDeactivateClose}
        />
      )}
    </div>
  );
}
