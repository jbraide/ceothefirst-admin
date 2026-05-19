import NotificationForm from "@/features/notifications/components/NotificationForm";

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send push notifications and announcements to platform users.
        </p>
      </div>
      <NotificationForm />
    </div>
  );
}
