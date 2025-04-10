import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useTranslations } from "@/hooks/use-translations";

interface Subscription {
  id: number;
  title: string;
  userId: number;
  status: string;
  createdAt: string;
  userName?: string;
}

export function RecentSubscriptions() {
  const { t } = useTranslations();
  const { data, isLoading } = useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ["/api/subscriptions", { limit: 5 }],
  });

  // Helper function to get badge variant based on subscription status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "outline-success";
      case "pending":
        return "outline-warning";
      case "expired":
      case "canceled":
        return "outline-destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.dashboard.recentSubscriptions}</CardTitle>
          <Button variant="ghost" asChild>
            <Link href="/subscriptions">{t.dashboard.viewSubscriptions}</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t.subscriptions.service}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t.users.title}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t.common.date}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t.subscriptions.status}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-16" />
                      </td>
                    </tr>
                  ))
              ) : data?.subscriptions?.length ? (
                data.subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">{sub.title}</td>
                    <td className="p-4 align-middle">
                      {sub.userName || `User #${sub.userId}`}
                    </td>
                    <td className="p-4 align-middle">
                      {formatDistanceToNow(new Date(sub.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getBadgeVariant(sub.status)}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
