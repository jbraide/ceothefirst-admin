import OwnersList from "@/features/owners/components/OwnersList";

export default function OwnersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Owners</h1>
        <p className="mt-1 text-sm text-gray-500">
          View all registered business owners and their businesses.
        </p>
      </div>
      <OwnersList />
    </div>
  );
}
