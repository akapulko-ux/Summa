import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslations } from "@/lib/translations";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCw } from "lucide-react";

type CashbackTransaction = {
  id: number;
  userId: number;
  amount: number;
  description: string;
  createdAt: string;
};

export default function CashbackHistory() {
  const { t, currentLocale } = useTranslations();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: cashbackData, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/cashback/history', page, limit],
    queryFn: () => apiRequest("GET", `/api/cashback/history?page=${page}&limit=${limit}`).then(res => res.json()),
  });

  // Форматирование даты в соответствии с локалью
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (currentLocale === 'ru') {
      return format(date, 'PPp', { locale: ru });
    }
    return format(date, 'PPp');
  };

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("cashback_history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-4 text-center text-muted-foreground">{t("error_loading_data")}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {t("try_again")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cashback_history")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : cashbackData?.history?.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashbackData.history.map((transaction: CashbackTransaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {cashbackData.total > limit && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(cashbackData.total / limit) }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(i + 1);
                        }}
                        isActive={page === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < Math.ceil(cashbackData.total / limit)) {
                          setPage(page + 1);
                        }
                      }}
                      className={page >= Math.ceil(cashbackData.total / limit) ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-center text-muted-foreground">{t("no_cashback_transactions")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}