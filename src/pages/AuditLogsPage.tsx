import AuditLogList from '@/features/audit/components/AuditLogList';

export default function AuditLogsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track admin actions and platform activity.
        </p>
      </div>
      <AuditLogList />
    </div>
  );
}
