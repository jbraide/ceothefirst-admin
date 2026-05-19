import PendingVerificationsList from "@/features/verifications/components/PendingVerificationsList";

export default function VerificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and process pending business verification requests.
        </p>
      </div>
      <PendingVerificationsList />
    </div>
  );
}
