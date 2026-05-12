import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@modticket/ui/components/alert-dialog";
import { Button } from "@modticket/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@modticket/ui/components/card";
import { DataTable } from "@modticket/ui/components/data-table";
import { Field, FieldLabel } from "@modticket/ui/components/field";
import { Input } from "@modticket/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@modticket/ui/components/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Layers, MapPin, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/venues")({
  component: VenuesComponent,
});

function CreateVenueForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useMutation(orpc.venue.create.mutationOptions());
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      capacity: Number(formData.get("capacity")),
    };

    try {
      await createMutation.mutateAsync(data);
      toast.success("Venue created successfully");
      queryClient.invalidateQueries({
        queryKey: orpc.venue.list.queryOptions().queryKey,
      });
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create venue"
      );
    }
  };

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input name="name" required />
      </Field>
      <Field>
        <FieldLabel>Location</FieldLabel>
        <Input name="location" required />
      </Field>
      <Field>
        <FieldLabel>Total Capacity</FieldLabel>
        <Input name="capacity" required type="number" />
      </Field>
      <Button
        className="mt-2 h-10 rounded-md"
        disabled={createMutation.isPending}
        type="submit"
      >
        {createMutation.isPending ? "Creating..." : "Create Venue"}
      </Button>
    </form>
  );
}

function EditVenueForm({
  venue,
  onSuccess,
}: {
  venue: { id: string; name: string; location: string; capacity: number };
  onSuccess: () => void;
}) {
  const updateMutation = useMutation(orpc.venue.update.mutationOptions());
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: venue.id,
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      capacity: Number(formData.get("capacity")),
    };

    try {
      await updateMutation.mutateAsync(data);
      toast.success("Venue updated successfully");
      queryClient.invalidateQueries({
        queryKey: orpc.venue.list.queryOptions().queryKey,
      });
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update venue"
      );
    }
  };

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input defaultValue={venue.name} name="name" required />
      </Field>
      <Field>
        <FieldLabel>Location</FieldLabel>
        <Input defaultValue={venue.location} name="location" required />
      </Field>
      <Field>
        <FieldLabel>Total Capacity</FieldLabel>
        <Input
          defaultValue={venue.capacity}
          name="capacity"
          required
          type="number"
        />
      </Field>
      <Button
        className="mt-2 h-10 rounded-md"
        disabled={updateMutation.isPending}
        type="submit"
      >
        {updateMutation.isPending ? "Updating..." : "Update Venue"}
      </Button>
    </form>
  );
}

function ManageZones({ venueId }: { venueId: string }) {
  const { data: zones, isLoading } = useQuery(
    orpc.venue.listZones.queryOptions({ input: { venueId } })
  );
  const queryClient = useQueryClient();
  const createZoneMutation = useMutation(
    orpc.venue.createZone.mutationOptions()
  );
  const deleteZoneMutation = useMutation(
    orpc.venue.deleteZone.mutationOptions()
  );

  const handleAddZone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      venueId,
      name: formData.get("name") as string,
      capacity: Number(formData.get("capacity")),
      price: formData.get("price") as string,
    };

    try {
      await createZoneMutation.mutateAsync(data);
      toast.success("Zone added successfully");
      queryClient.invalidateQueries({
        queryKey: orpc.venue.listZones.queryOptions({ input: { venueId } })
          .queryKey,
      });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add zone");
    }
  };

  const handleDeleteZone = useCallback(
    async (id: string) => {
      try {
        await deleteZoneMutation.mutateAsync({ id });
        toast.success("Zone deleted successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.venue.listZones.queryOptions({ input: { venueId } })
            .queryKey,
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete zone"
        );
      }
    },
    [deleteZoneMutation, queryClient, venueId]
  );

  type Zone = NonNullable<typeof zones>[number];

  const columns = useMemo<ColumnDef<Zone>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            className="-ml-4 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            Name
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
      },
      {
        accessorKey: "capacity",
        header: ({ column }) => (
          <Button
            className="-ml-4 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            Capacity
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => `$${row.getValue("price")}`,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const zone = row.original;
          return (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button size="icon" variant="ghost" />}
              >
                <Trash2 className="size-4 text-destructive" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Zone</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the zone "{zone.name}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleDeleteZone(zone.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        },
      },
    ],
    [handleDeleteZone]
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <Card className="rounded-lg border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Add new zone</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={handleAddZone}
          >
            <Field className="sm:col-span-2">
              <FieldLabel>Zone Name</FieldLabel>
              <Input name="name" placeholder="e.g. VIP, Economy" required />
            </Field>
            <Field>
              <FieldLabel>Capacity</FieldLabel>
              <Input name="capacity" required type="number" />
            </Field>
            <Field>
              <FieldLabel>Price</FieldLabel>
              <Input name="price" required step="0.01" type="number" />
            </Field>
            <Button
              className="h-10 rounded-md sm:col-span-2"
              disabled={createZoneMutation.isPending}
              type="submit"
            >
              {createZoneMutation.isPending ? "Adding..." : "Add Zone"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center rounded-lg border border-border/70 bg-card text-sm">
          Loading zones...
        </div>
      ) : (
        <DataTable columns={columns} data={zones ?? []} searchKey="name" />
      )}
    </div>
  );
}

function VenuesComponent() {
  const { data: venues, isLoading } = useQuery(orpc.venue.list.queryOptions());
  const deleteMutation = useMutation(orpc.venue.delete.mutationOptions());
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<{
    id: string;
    name: string;
    location: string;
    capacity: number;
  } | null>(null);
  const [managingVenue, setManagingVenue] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Venue deleted successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.venue.list.queryOptions().queryKey,
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete venue"
        );
      }
    },
    [deleteMutation, queryClient]
  );

  type Venue = NonNullable<typeof venues>[number];

  const columns = useMemo<ColumnDef<Venue>[]>(
    () => [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
        header: ({ column }) => (
          <Button
            className="-ml-4 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            Name
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
      },
      {
        accessorKey: "location",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3" />
            {row.getValue("location")}
          </div>
        ),
        header: "Location",
      },
      {
        accessorKey: "capacity",
        header: ({ column }) => (
          <Button
            className="-ml-4 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            Capacity
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const venue = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  setManagingVenue({ id: venue.id, name: venue.name })
                }
                size="icon-sm"
                variant="secondary"
              >
                <Layers className="size-4" />
              </Button>
              <Button
                onClick={() => setEditingVenue(venue)}
                size="icon-sm"
                variant="secondary"
              >
                <Edit className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button size="icon-sm" variant="destructive" />}
                >
                  <Trash2 className="size-4 text-destructive" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{venue.name}"? This
                      action cannot be undone and may fail if there are concerts
                      or zones attached to it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleDelete(venue.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    [handleDelete]
  );

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section className="rounded-lg border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="size-4 text-foreground" />
                Venue inventory
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Keep every stage, hall, and seating zone organized.
              </p>
            </div>
            <Sheet onOpenChange={setIsCreateOpen} open={isCreateOpen}>
              <SheetTrigger
                render={
                  <Button className="h-11 rounded-md">
                    <Plus className="size-4" />
                    Add venue
                  </Button>
                }
              />
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create venue</SheetTitle>
                  <SheetDescription>
                    Add a new venue to the system.
                  </SheetDescription>
                </SheetHeader>
                <CreateVenueForm onSuccess={() => setIsCreateOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Total venues</p>
              <p className="mt-2 font-semibold text-3xl tabular-nums">
                {(venues?.length ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Total capacity</p>
              <p className="mt-2 font-semibold text-3xl tabular-nums">
                {(
                  venues?.reduce((sum, venue) => sum + venue.capacity, 0) ?? 0
                ).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Avg. capacity</p>
              <p className="mt-2 font-semibold text-3xl tabular-nums">
                {venues && venues.length > 0
                  ? Math.round(
                      venues.reduce((sum, venue) => sum + venue.capacity, 0) /
                        venues.length
                    ).toLocaleString()
                  : "0"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="border-border/70 border-b px-6 py-5">
            <CardTitle className="text-xl">All venues</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-border/70 text-muted-foreground text-sm">
                Loading venues...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={venues ?? []}
                searchKey="name"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet
        onOpenChange={(open) => !open && setEditingVenue(null)}
        open={!!editingVenue}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Venue</SheetTitle>
            <SheetDescription>Update venue details.</SheetDescription>
          </SheetHeader>
          {editingVenue && (
            <EditVenueForm
              onSuccess={() => setEditingVenue(null)}
              venue={editingVenue}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        onOpenChange={(open) => !open && setManagingVenue(null)}
        open={!!managingVenue}
      >
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Manage Zones: {managingVenue?.name}</SheetTitle>
            <SheetDescription>
              Configure seating zones and pricing for this venue.
            </SheetDescription>
          </SheetHeader>
          {managingVenue && <ManageZones venueId={managingVenue.id} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
