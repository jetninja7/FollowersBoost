'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformForm } from '@/components/admin/platform-form';
import { CategoryForm } from '@/components/admin/category-form';
import { ServiceForm } from '@/components/admin/service-form';

interface Platform {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  isActive: boolean;
  order: number;
}

interface Category {
  id: string;
  platformId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  platform?: {
    name: string;
  };
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  minQuantity: number;
  maxQuantity: number;
  estimatedDeliveryTime: string | null;
  isActive: boolean;
  category?: {
    name: string;
    platform?: {
      name: string;
    };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminServicesPage() {
  // Platforms state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryPlatformFilter, setCategoryPlatformFilter] = useState('all');

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicePlatformFilter, setServicePlatformFilter] = useState('all');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [servicePage, setServicePage] = useState(1);
  const [servicePagination, setServicePagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'platform' | 'category' | 'service' | null;
    id: string | null;
    name: string | null;
  }>({
    open: false,
    type: null,
    id: null,
    name: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Modal state
  const [platformModal, setPlatformModal] = useState<{
    open: boolean;
    platform: Platform | null;
  }>({ open: false, platform: null });

  const [categoryModal, setCategoryModal] = useState<{
    open: boolean;
    category: Category | null;
  }>({ open: false, category: null });

  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    service: Service | null;
  }>({ open: false, service: null });

  // Fetch platforms
  const fetchPlatforms = async () => {
    setPlatformsLoading(true);
    try {
      const response = await fetch('/api/admin/platforms');
      if (!response.ok) throw new Error('Failed to fetch platforms');
      const data = await response.json();
      setPlatforms(data.platforms || []);
    } catch (error) {
      toast.error('Failed to load platforms');
      console.error(error);
    } finally {
      setPlatformsLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryPlatformFilter !== 'all') {
        params.append('platformId', categoryPlatformFilter);
      }

      const response = await fetch(`/api/admin/categories?${params}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch services
  const fetchServices = async () => {
    setServicesLoading(true);
    try {
      const params = new URLSearchParams({
        page: servicePage.toString(),
        limit: '20',
      });

      if (serviceSearchQuery) {
        params.append('search', serviceSearchQuery);
      }
      if (servicePlatformFilter !== 'all') {
        params.append('platformId', servicePlatformFilter);
      }
      if (serviceCategoryFilter !== 'all') {
        params.append('categoryId', serviceCategoryFilter);
      }

      const response = await fetch(`/api/admin/services?${params}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data.services || []);
      if (data.pagination) {
        setServicePagination(data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    } finally {
      setServicesLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchPlatforms();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [categoryPlatformFilter]);

  useEffect(() => {
    fetchServices();
  }, [servicePage, servicePlatformFilter, serviceCategoryFilter]);

  // Handlers
  const handleServiceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setServicePage(1);
    fetchServices();
  };

  const openDeleteDialog = (
    type: 'platform' | 'category' | 'service',
    id: string,
    name: string
  ) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, type: null, id: null, name: null });
  };

  const handleDelete = async () => {
    if (!deleteDialog.type || !deleteDialog.id) return;

    setDeleting(true);
    try {
      const endpoint = `/api/admin/${deleteDialog.type === 'platform' ? 'platforms' : deleteDialog.type === 'category' ? 'categories' : 'services'}/${deleteDialog.id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete');
      }

      toast.success(`${deleteDialog.type.charAt(0).toUpperCase() + deleteDialog.type.slice(1)} deleted successfully`);

      // Refresh data
      if (deleteDialog.type === 'platform') {
        fetchPlatforms();
        fetchCategories();
        fetchServices();
      } else if (deleteDialog.type === 'category') {
        fetchCategories();
        fetchServices();
      } else {
        fetchServices();
      }

      closeDeleteDialog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(`Failed to delete ${deleteDialog.type}`, {
        description: errorMessage,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Filter available categories for services tab
  const availableCategories = categories.filter((cat) => {
    if (servicePlatformFilter === 'all') return true;
    return cat.platformId === servicePlatformFilter;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Services Management</h1>
      </div>

      <Tabs defaultValue="platforms">
        <TabsList>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Platforms Tab */}
        <TabsContent value="platforms">
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Platforms</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPlatformModal({ open: true, platform: null })}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Platform
                </Button>
                <Button onClick={fetchPlatforms} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          {platformsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Slug</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Order</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.map((platform) => (
                      <tr key={platform.id} className="border-b last:border-0">
                        <td className="p-4">{platform.name}</td>
                        <td className="p-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {platform.slug}
                          </code>
                        </td>
                        <td className="p-4">
                          <Badge variant={platform.isActive ? 'default' : 'secondary'}>
                            {platform.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">{platform.order}</td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPlatformModal({ open: true, platform })
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openDeleteDialog('platform', platform.id, platform.name)
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {platforms.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No platforms found
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Categories</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCategoryModal({ open: true, category: null })}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Category
                </Button>
                <Button onClick={fetchCategories} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <Select
                value={categoryPlatformFilter}
                onValueChange={(value) => setCategoryPlatformFilter(value || 'all')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Platform</th>
                      <th className="text-left p-4">Slug</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b last:border-0">
                        <td className="p-4">{category.name}</td>
                        <td className="p-4">{category.platform?.name || 'N/A'}</td>
                        <td className="p-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        </td>
                        <td className="p-4">
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setCategoryModal({ open: true, category })
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openDeleteDialog('category', category.id, category.name)
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categories.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No categories found
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Services</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setServiceModal({ open: true, service: null })}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Service
                </Button>
                <Button onClick={fetchServices} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <form onSubmit={handleServiceSearch} className="flex gap-2">
                  <Input
                    placeholder="Search services..."
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                </form>
              </div>
              <Select
                value={servicePlatformFilter}
                onValueChange={(value) => {
                  setServicePlatformFilter(value || 'all');
                  setServiceCategoryFilter('all');
                  setServicePage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={serviceCategoryFilter}
                onValueChange={(value) => {
                  setServiceCategoryFilter(value || 'all');
                  setServicePage(1);
                }}
                disabled={servicePlatformFilter === 'all'}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {servicesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Name</th>
                        <th className="text-left p-4">Platform</th>
                        <th className="text-left p-4">Price</th>
                        <th className="text-left p-4">Quantity</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-right p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr key={service.id} className="border-b last:border-0">
                          <td className="p-4">{service.name}</td>
                          <td className="p-4">
                            {service.category?.platform?.name || 'N/A'}
                          </td>
                          <td className="p-4">${Number(service.price).toFixed(2)}</td>
                          <td className="p-4">
                            {service.minQuantity} - {service.maxQuantity}
                          </td>
                          <td className="p-4">
                            <Badge variant={service.isActive ? 'default' : 'secondary'}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setServiceModal({ open: true, service })
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openDeleteDialog('service', service.id, service.name)
                                }
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {services.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No services found
                    </div>
                  )}
                </div>
              </Card>

              {servicePagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    onClick={() => setServicePage((p) => Math.max(1, p - 1))}
                    disabled={servicePage === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="py-2 px-4">
                    Page {servicePage} of {servicePagination.totalPages}
                  </span>
                  <Button
                    onClick={() =>
                      setServicePage((p) =>
                        Math.min(servicePagination.totalPages, p + 1)
                      )
                    }
                    disabled={servicePage === servicePagination.totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteDialog.type}{' '}
              <span className="font-semibold">{deleteDialog.name}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Platform Form Modal */}
      <PlatformForm
        isOpen={platformModal.open}
        onClose={() => setPlatformModal({ open: false, platform: null })}
        onSuccess={() => {
          fetchPlatforms();
          fetchCategories();
          fetchServices();
        }}
        platform={platformModal.platform}
      />

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSuccess={() => {
          fetchCategories();
          fetchServices();
        }}
        platforms={platforms}
        category={categoryModal.category}
      />

      {/* Service Form Modal */}
      <ServiceForm
        isOpen={serviceModal.open}
        onClose={() => setServiceModal({ open: false, service: null })}
        onSuccess={fetchServices}
        categories={categories}
        service={serviceModal.service}
      />
    </div>
  );
}
