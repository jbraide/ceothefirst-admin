import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { getTopBusinesses } from "../api/getTopBusinesses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { naira } from "@/features/analytics/utils";

// ─── Rank Badge ────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Trophy className="h-4 w-4" />
      </span>
    );
  }

  const colors: Record<number, string> = {
    2: "bg-gray-200 text-gray-700",
    3: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${colors[rank] ?? "bg-gray-100 text-gray-500"}`}
    >
      {rank}
    </span>
  );
}

// ─── Top Businesses Table ──────────────────────────────────────────────

export default function TopBusinessesTable() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "top-businesses", "30d"],
    queryFn: () => getTopBusinesses(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Businesses by Volume</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle>Top Businesses by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load top businesses.</p>
        </CardContent>
      </Card>
    );
  }

  // Take top 10
  const top10 = data.slice(0, 10);

  if (top10.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Businesses by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-gray-500">
            No business data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Businesses by Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-2 font-medium">#</th>
                <th className="pb-3 pr-2 font-medium">Business</th>
                <th className="pb-3 text-right font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((biz, idx) => (
                <tr
                  key={biz.businessId}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-3 pr-2">
                    <RankBadge rank={idx + 1} />
                  </td>
                  <td className="py-3 pr-2 font-medium text-gray-900">
                    {biz.businessName}
                  </td>
                  <td className="py-3 text-right tabular-nums text-gray-700">
                    {naira.format(biz.totalVolume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
