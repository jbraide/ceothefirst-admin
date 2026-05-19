import BusinessList from '@/features/businesses/components/BusinessList';

export default function BusinessesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and review registered businesses on the platform.
        </p>
      </div>
      <BusinessList />
    </div>
  );
}
