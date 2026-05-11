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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@modticket/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Edit, Layers, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
      <Button disabled={createMutation.isPending} type="submit">
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
      <Button disabled={updateMutation.isPending} type="submit">
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

  const handleDeleteZone = async (id: string) => {
    try {
      await deleteZoneMutation.mutateAsync({ id });
      toast.success("Zone deleted successfully");
      queryClient.invalidateQueries({
        queryKey: orpc.venue.listZones.queryOptions({ input: { venueId } })
          .queryKey,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete zone");
    }
  };

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <TableRow>
        <TableCell className="text-center" colSpan={4}>
          Loading zones...
        </TableCell>
      </TableRow>
    );
  } else if (zones?.length === 0) {
    content = (
      <TableRow>
        <TableCell className="text-center" colSpan={4}>
          No zones found.
        </TableCell>
      </TableRow>
    );
  } else {
    content = zones?.map((zone) => (
      <TableRow key={zone.id}>
        <TableCell>{zone.name}</TableCell>
        <TableCell>{zone.capacity}</TableCell>
        <TableCell>${zone.price}</TableCell>
        <TableCell>
          <AlertDialog>
            <AlertDialogTrigger render={<Button size="icon" variant="ghost" />}>
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
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-4 items-end gap-4"
            onSubmit={handleAddZone}
          >
            <Field>
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
            <Button disabled={createZoneMutation.isPending} type="submit">
              {createZoneMutation.isPending ? "Adding..." : "Add Zone"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{content}</TableBody>
        </Table>
      </div>
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

  const handleDelete = async (id: string) => {
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
  };

  let tableContent: React.ReactNode;

  if (isLoading) {
    tableContent = (
      <TableRow>
        <TableCell className="text-center" colSpan={4}>
          Loading venues...
        </TableCell>
      </TableRow>
    );
  } else if (venues?.length === 0) {
    tableContent = (
      <TableRow>
        <TableCell className="text-center" colSpan={4}>
          No venues found.
        </TableCell>
      </TableRow>
    );
  } else {
    tableContent = venues?.map((venue) => (
      <TableRow key={venue.id}>
        <TableCell className="font-medium">{venue.name}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3" />
            {venue.location}
          </div>
        </TableCell>
        <TableCell>{venue.capacity}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                setManagingVenue({ id: venue.id, name: venue.name })
              }
              size="icon"
              variant="ghost"
            >
              <Layers className="size-4" />
            </Button>
            <Button
              onClick={() => setEditingVenue(venue)}
              size="icon"
              variant="ghost"
            >
              <Edit className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button size="icon" variant="ghost" />}
              >
                <Trash2 className="size-4 text-destructive" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{venue.name}"? This action
                    cannot be undone and may fail if there are concerts or zones
                    attached to it.
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
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Venues</h1>
        <Sheet onOpenChange={setIsCreateOpen} open={isCreateOpen}>
          <SheetTrigger render={<Button />}>
            <Plus className="mr-2 size-4" /> Add Venue
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Venue</SheetTitle>
              <SheetDescription>
                Add a new venue to the system.
              </SheetDescription>
            </SheetHeader>
            <CreateVenueForm onSuccess={() => setIsCreateOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{tableContent}</TableBody>
        </Table>
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
