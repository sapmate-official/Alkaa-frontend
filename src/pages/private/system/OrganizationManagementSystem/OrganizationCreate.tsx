import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import { useCreateOrganization, type OrganizationType } from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/apiError';

const OrganizationCreate = () => {
  const router = useNavigate();
  const { toast } = useToast();
  const createOrganization = useCreateOrganization();
  const [form, setForm] = useState({
    name: '',
    industry: '',
    address: '',
    timezone: 'Asia/Kolkata',
    subscriptionEnd: '',
    isActive: true
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast({
        variant: "destructive",
        title: "Organization name is required",
      });
      return;
    }

    const payload: Partial<OrganizationType> = {
      name: form.name.trim(),
      industry: form.industry.trim() || null,
      address: form.address.trim() || null,
      timezone: form.timezone.trim() || undefined,
      isActive: form.isActive,
      subscriptionEnd: form.subscriptionEnd
        ? new Date(form.subscriptionEnd).toISOString()
        : null
    };

    try {
      const organization = await createOrganization.mutateAsync(payload);
      toast({
        title: "Organization created successfully",
        description: "You can now assign organization admins from the details page.",
      });
      router(RouteDict.SuperAdmin.OrganizationDetails(organization.id));
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to create organization",
        description: getApiErrorMessage(error, "An unexpected error occurred"),
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">Create Organization</h1>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            This creates the organization on the new TypeScript backend. Admins are
            assigned by user id once employees have been created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Enter organization name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="Enter industry"
                value={form.industry}
                onChange={(event) => setForm({ ...form, industry: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  placeholder="Asia/Kolkata"
                  value={form.timezone}
                  onChange={(event) => setForm({ ...form, timezone: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionEnd">Subscription End</Label>
                <Input
                  id="subscriptionEnd"
                  type="date"
                  value={form.subscriptionEnd}
                  onChange={(event) => setForm({ ...form, subscriptionEnd: event.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })}
              />
              <Label htmlFor="isActive">Organization is active</Label>
            </div>

            <Button className="w-full" type="submit" disabled={createOrganization.isPending}>
              {createOrganization.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Organization
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationCreate;
