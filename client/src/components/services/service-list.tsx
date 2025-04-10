import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchIcon, Pencil, Trash, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Service } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ServiceForm } from "./service-form";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";

export function ServiceList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslations();
  const isAdmin = user?.role === "admin";

  const {
    data,
    isLoading,
    isError,
  } = useQuery<{ services: Service[], total: number }>({
    queryKey: ["/api/services", { page, limit, search: searchQuery }],
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      await apiRequest("DELETE", `/api/services/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
  });

  const handleEdit = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setIsEditDialogOpen(true);
  };

  const handleView = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (serviceId: number) => {
    if (window.confirm(t.services.confirmDelete)) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data && page < Math.ceil(data.total / limit)) {
      setPage(page + 1);
    }
  };

  // Function to format cashback value for display
  const formatCashback = (cashback: string | null | undefined) => {
    if (!cashback) return "None";
    
    // Display as percentage if it ends with %
    if (cashback.endsWith("%")) {
      return cashback;
    }
    
    // Otherwise display as currency
    return `$${cashback}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.services.title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t.common.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    {t.services.addService}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t.services.addService}</DialogTitle>
                  </DialogHeader>
                  <ServiceForm 
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/services"] })} 
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.services.serviceTitle}</TableHead>
                <TableHead>{t.services.serviceDescription}</TableHead>
                <TableHead>{t.services.cashback}</TableHead>
                <TableHead>{t.common.edit}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    {t.messages.serverError}
                  </TableCell>
                </TableRow>
              ) : data?.services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    {t.services.noServices}
                  </TableCell>
                </TableRow>
              ) : (
                data?.services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {service.iconUrl ? (
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <img 
                              src={service.iconUrl} 
                              alt={service.title} 
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {service.title.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium">{service.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate">
                        {service.description || t.services.noDescription}
                      </div>
                    </TableCell>
                    <TableCell>{formatCashback(service.cashback)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(service.id)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(service.id)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {data && (
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {t.services.showingServices.replace('{count}', String(data.services.length)).replace('{total}', String(data.total))}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= Math.ceil(data.total / limit)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardFooter>
      )}

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {selectedServiceId && (
            <ServiceForm 
              serviceId={selectedServiceId} 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/services"] });
                setIsEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Service Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
          </DialogHeader>
          {selectedServiceId && (
            <ServiceDetails serviceId={selectedServiceId} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ServiceDetails({ serviceId }: { serviceId: number }) {
  const { t } = useTranslations();
  const { data: service, isLoading } = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (!service) {
    return <div className="p-4 text-muted-foreground">Service not found</div>;
  }

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center gap-3 mb-4">
        {service.iconUrl ? (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <img 
              src={service.iconUrl} 
              alt={service.title} 
              className="w-8 h-8 object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {service.title.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <h3 className="text-xl font-bold">{service.title}</h3>
      </div>

      {service.description && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
          <p className="text-sm">{service.description}</p>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-1">Cashback</h4>
        <p className="text-sm">
          {service.cashback ? (
            service.cashback.endsWith("%") ? (
              <>{service.cashback} of subscription value</>
            ) : (
              <>${service.cashback} fixed cashback</>
            )
          ) : (
            "No cashback available"
          )}
        </p>
      </div>

      {service.customFields && Object.keys(service.customFields).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Custom Fields</h4>
          <div className="space-y-2">
            {Object.entries(service.customFields).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="text-sm font-medium mr-2">{key}:</span>
                <span className="text-sm">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between text-sm text-muted-foreground pt-4 border-t">
        <div>Created: {new Date(service.createdAt).toLocaleDateString()}</div>
        <div>Updated: {new Date(service.updatedAt).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
