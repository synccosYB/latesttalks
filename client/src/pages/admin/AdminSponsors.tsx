import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, ExternalLink, Upload, Star, Crown, Image, X, Copy, Clock, Tag } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { Sponsor, SponsorPromoCode } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

function toLocalDatetimeValue(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function AdminSponsors() {
  const [search, setSearch] = useState("");
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logoUploadingSponsorId, setLogoUploadingSponsorId] = useState<string | null>(null);
  const [companyPhone, setCompanyPhone] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [personalCell, setPersonalCell] = useState("");
  const [promoCodesOpen, setPromoCodesOpen] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingSponsor) {
      setCompanyPhone(editingSponsor.companyPhone || "");
      setContactPhone(editingSponsor.contactPhone || "");
      setPersonalCell(editingSponsor.personalCell || "");
    } else {
      setCompanyPhone("");
      setContactPhone("");
      setPersonalCell("");
    }
  }, [editingSponsor]);

  const { data: sponsors, isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleLogoUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, sponsorId: string) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      if (uploadURL) {
        try {
          const response = await apiRequest("PUT", `/api/sponsors/${sponsorId}/logo`, { imageURL: uploadURL });
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
            toast({ title: "Logo uploaded successfully" });
          } else {
            toast({ title: "Failed to save logo", variant: "destructive" });
          }
        } catch {
          toast({ title: "Failed to upload logo", variant: "destructive" });
        }
      }
    }
    setLogoUploadingSponsorId(null);
  };

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const res = await apiRequest("PATCH", `/api/sponsors/${id}`, { isFeatured });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({ title: "Featured status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update featured status", variant: "destructive" });
    },
  });

  const togglePrimeMutation = useMutation({
    mutationFn: async ({ id, isPrime }: { id: string; isPrime: boolean }) => {
      const res = await apiRequest("PATCH", `/api/sponsors/${id}`, { isPrime });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({ title: "Prime sponsor status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update prime status", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Sponsor>) => {
      const res = await apiRequest("POST", "/api/sponsors", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsDialogOpen(false);
      toast({ title: "Sponsor created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create sponsor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Sponsor> }) => {
      const res = await apiRequest("PATCH", `/api/sponsors/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsDialogOpen(false);
      setEditingSponsor(null);
      toast({ title: "Sponsor updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update sponsor", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sponsors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({ title: "Sponsor deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete sponsor", variant: "destructive" });
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sponsors/${id}/logo`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({ title: "Logo removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove logo", variant: "destructive" });
    },
  });

  const { data: promoCodes } = useQuery<SponsorPromoCode[]>({
    queryKey: ["/api/sponsors", promoCodesOpen, "promo-codes"],
    queryFn: async () => {
      const res = await fetch(`/api/sponsors/${promoCodesOpen}/promo-codes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      return res.json();
    },
    enabled: !!promoCodesOpen,
  });

  const createPromoCodeMutation = useMutation({
    mutationFn: async ({ sponsorId, data }: { sponsorId: string; data: any }) => {
      const res = await apiRequest("POST", `/api/sponsors/${sponsorId}/promo-codes`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors", promoCodesOpen, "promo-codes"] });
      toast({ title: "Promo code added" });
    },
    onError: () => {
      toast({ title: "Failed to add promo code", variant: "destructive" });
    },
  });

  const updatePromoCodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/sponsor-promo-codes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors", promoCodesOpen, "promo-codes"] });
      toast({ title: "Promo code updated" });
    },
    onError: () => {
      toast({ title: "Failed to update promo code", variant: "destructive" });
    },
  });

  const deletePromoCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sponsor-promo-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors", promoCodesOpen, "promo-codes"] });
      toast({ title: "Promo code deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete promo code", variant: "destructive" });
    },
  });

  const handleAddPromoCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!promoCodesOpen) return;
    const fd = new FormData(e.currentTarget);
    const exp = fd.get("expiration") as string;
    createPromoCodeMutation.mutate({
      sponsorId: promoCodesOpen,
      data: {
        code: fd.get("code") as string,
        expiration: exp ? new Date(exp).toISOString() : null,
        link: (fd.get("link") as string) || null,
        memo: (fd.get("memo") as string) || null,
      },
    });
    e.currentTarget.reset();
  };

  const filteredSponsors = sponsors?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const promoExpiration = formData.get("promoCodeExpiration") as string;
    const data = {
      name: formData.get("name") as string,
      website: formData.get("website") as string || null,
      contactName: formData.get("contactName") as string || null,
      contactEmail: formData.get("contactEmail") as string || null,
      contactPhone: contactPhone || null,
      contractStatus: formData.get("contractStatus") as string,
      promoCode: formData.get("promoCode") as string || null,
      promoCodeExpiration: promoExpiration ? new Date(promoExpiration) : null,
      companyPhone: companyPhone || null,
      companyEmail: formData.get("companyEmail") as string || null,
      promoMemo: formData.get("promoMemo") as string || null,
      promoLink: formData.get("promoLink") as string || null,
      contactTitle: formData.get("contactTitle") as string || null,
      personalName: formData.get("personalName") as string || null,
      personalCell: personalCell || null,
      personalEmail: formData.get("personalEmail") as string || null,
    };

    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Sponsors</h1>
            <p className="text-muted-foreground">Manage podcast sponsors</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSponsor(null)} data-testid="button-add-sponsor">
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground border-b pb-2">Company Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingSponsor?.name || ""}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        defaultValue={editingSponsor?.website || ""}
                        placeholder="https://..."
                        data-testid="input-website"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contractStatus">Status</Label>
                      <Select name="contractStatus" defaultValue={editingSponsor?.contractStatus || "active"}>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Company Phone</Label>
                      <div className="phone-input-wrapper" data-testid="input-company-phone">
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={companyPhone}
                          onChange={(value) => setCompanyPhone(value || "")}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        type="email"
                        defaultValue={editingSponsor?.companyEmail || ""}
                        placeholder="info@company.com"
                        data-testid="input-company-email"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground border-b pb-2">Primary Contact (On-Air)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        name="contactName"
                        defaultValue={editingSponsor?.contactName || ""}
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <div className="phone-input-wrapper" data-testid="input-contact-phone">
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={contactPhone}
                          onChange={(value) => setContactPhone(value || "")}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      defaultValue={editingSponsor?.contactEmail || ""}
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground border-b pb-2">Backend Contact (Internal)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="personalName">Personal Name</Label>
                      <Input
                        id="personalName"
                        name="personalName"
                        defaultValue={editingSponsor?.personalName || ""}
                        placeholder="Account manager"
                        data-testid="input-personal-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactTitle">Title</Label>
                      <Input
                        id="contactTitle"
                        name="contactTitle"
                        defaultValue={editingSponsor?.contactTitle || ""}
                        placeholder="e.g., Marketing Director"
                        data-testid="input-contact-title"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="personalCell">Personal Cell</Label>
                      <div className="phone-input-wrapper" data-testid="input-personal-cell">
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={personalCell}
                          onChange={(value) => setPersonalCell(value || "")}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="personalEmail">Personal Email</Label>
                      <Input
                        id="personalEmail"
                        name="personalEmail"
                        type="email"
                        defaultValue={editingSponsor?.personalEmail || ""}
                        data-testid="input-personal-email"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground border-b pb-2">Promo Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promoCode">Promo Code</Label>
                      <Input
                        id="promoCode"
                        name="promoCode"
                        defaultValue={editingSponsor?.promoCode || ""}
                        placeholder="e.g., LATEST20"
                        data-testid="input-promo-code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promoCodeExpiration">Promo Expiration</Label>
                      <Input
                        id="promoCodeExpiration"
                        name="promoCodeExpiration"
                        type="datetime-local"
                        defaultValue={toLocalDatetimeValue(editingSponsor?.promoCodeExpiration)}
                        data-testid="input-promo-expiration"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promoLink">Promo Link</Label>
                    <Input
                      id="promoLink"
                      name="promoLink"
                      type="url"
                      defaultValue={editingSponsor?.promoLink || ""}
                      placeholder="https://company.com/promo"
                      data-testid="input-promo-link"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promoMemo">Promo Memo</Label>
                    <Input
                      id="promoMemo"
                      name="promoMemo"
                      defaultValue={editingSponsor?.promoMemo || ""}
                      placeholder="Special instructions or notes"
                      data-testid="input-promo-memo"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-sponsor"
                  >
                    {editingSponsor ? "Update" : "Create"} Sponsor
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sponsors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Promo Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4" />
                        Featured
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Crown className="h-4 w-4 text-amber-500" />
                        Prime
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsors?.map((sponsor) => (
                    <TableRow key={sponsor.id} data-testid={`row-sponsor-${sponsor.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-10 w-10 rounded-md">
                            {sponsor.logoUrl ? (
                              <AvatarImage src={sponsor.logoUrl} alt={sponsor.name} className="object-contain" />
                            ) : (
                              <AvatarFallback className="rounded-md">
                                <Image className="h-4 w-4 text-muted-foreground" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex flex-col gap-1">
                            <ObjectUploader
                              maxFileSize={5242880}
                              allowedFileTypes={["image/*"]}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleLogoUploadComplete(result, sponsor.id)}
                              buttonClassName="h-7 px-2"
                            >
                              <Upload className="h-3 w-3" />
                            </ObjectUploader>
                            {sponsor.logoUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Remove this logo?")) {
                                    removeLogoMutation.mutate(sponsor.id);
                                  }
                                }}
                                data-testid={`button-remove-logo-${sponsor.id}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{sponsor.name}</TableCell>
                      <TableCell>
                        {sponsor.website ? (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {sponsor.promoCode && (
                            <div className="space-y-1">
                              <Badge variant="outline" className="font-mono">{sponsor.promoCode}</Badge>
                              {sponsor.promoCodeExpiration && (
                                <p className="text-xs text-muted-foreground">
                                  Exp: {new Date(sponsor.promoCodeExpiration).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPromoCodesOpen(sponsor.id)}
                            data-testid={`button-promo-codes-${sponsor.id}`}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            Promo Codes
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sponsor.contractStatus === "active" ? "default" : "secondary"}>
                          {sponsor.contractStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={sponsor.isFeatured || false}
                          onCheckedChange={(checked) => 
                            toggleFeaturedMutation.mutate({ id: sponsor.id, isFeatured: checked })
                          }
                          data-testid={`switch-featured-${sponsor.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={sponsor.isPrime || false}
                          onCheckedChange={(checked) => 
                            togglePrimeMutation.mutate({ id: sponsor.id, isPrime: checked })
                          }
                          className="data-[state=checked]:bg-amber-500"
                          data-testid={`switch-prime-${sponsor.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSponsor(sponsor);
                            setIsDialogOpen(true);
                          }}
                          data-testid={`button-edit-${sponsor.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this sponsor?")) {
                              deleteMutation.mutate(sponsor.id);
                            }
                          }}
                          data-testid={`button-delete-${sponsor.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!promoCodesOpen} onOpenChange={(open) => !open && setPromoCodesOpen(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Promo Codes — {sponsors?.find(s => s.id === promoCodesOpen)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <form onSubmit={handleAddPromoCode} className="space-y-3 p-4 border rounded-md bg-muted/30" data-testid="form-add-promo-code">
                <h4 className="text-sm font-medium">Add New Promo Code</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="new-promo-code" className="text-xs">Code</Label>
                    <Input id="new-promo-code" name="code" required placeholder="e.g., SAVE20" data-testid="input-new-promo-code" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-promo-expiration" className="text-xs">Expiration</Label>
                    <Input id="new-promo-expiration" name="expiration" type="datetime-local" data-testid="input-new-promo-expiration" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-promo-link" className="text-xs">Link</Label>
                  <Input id="new-promo-link" name="link" type="url" placeholder="https://company.com/promo" data-testid="input-new-promo-link" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-promo-memo" className="text-xs">Memo</Label>
                  <Input id="new-promo-memo" name="memo" placeholder="Details about this promo" data-testid="input-new-promo-memo" />
                </div>
                <Button type="submit" size="sm" disabled={createPromoCodeMutation.isPending} data-testid="button-add-promo-code">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Code
                </Button>
              </form>

              {promoCodes && promoCodes.length > 0 ? (
                <div className="space-y-2">
                  {promoCodes.map((pc) => (
                    <div key={pc.id} className="flex items-start gap-3 p-3 border rounded-md" data-testid={`promo-code-${pc.id}`}>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono">{pc.code}</Badge>
                          <Badge variant={pc.isActive ? "default" : "secondary"}>
                            {pc.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {pc.expiration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(pc.expiration).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {pc.memo && (
                          <p className="text-sm text-muted-foreground">{pc.memo}</p>
                        )}
                        {pc.link && (
                          <a href={pc.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {pc.link}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(pc.code);
                            toast({ title: "Copied to clipboard" });
                          }}
                          data-testid={`button-copy-promo-${pc.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Switch
                          checked={pc.isActive ?? true}
                          onCheckedChange={(checked) =>
                            updatePromoCodeMutation.mutate({ id: pc.id, data: { isActive: checked } })
                          }
                          data-testid={`switch-promo-active-${pc.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this promo code?")) {
                              deletePromoCodeMutation.mutate(pc.id);
                            }
                          }}
                          data-testid={`button-delete-promo-${pc.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-promo-codes">
                  No additional promo codes yet. Use the form above to add one.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
