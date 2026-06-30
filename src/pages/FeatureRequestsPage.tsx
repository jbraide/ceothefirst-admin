import FeatureRequestsList from "@/features/feature-requests/components/FeatureRequestsList";

export default function FeatureRequestsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feature Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage feature requests from businesses across the
          platform.
        </p>
      </div>
      <FeatureRequestsList />
    </div>
  );
}
