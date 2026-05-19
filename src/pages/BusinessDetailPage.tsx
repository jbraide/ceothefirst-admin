import { useParams, useNavigate } from "react-router-dom";
import BusinessDetailView from "@/features/businesses/components/BusinessDetailView";

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate("/businesses", { replace: true });
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("/businesses")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Businesses
      </button>
      <BusinessDetailView />
    </div>
  );
}
