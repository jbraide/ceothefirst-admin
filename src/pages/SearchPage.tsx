import GlobalSearch from '@/features/search/components/GlobalSearch';

export default function SearchPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search across businesses, users, and transactions.
        </p>
      </div>
      <GlobalSearch />
    </div>
  );
}
