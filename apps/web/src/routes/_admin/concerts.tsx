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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@modticket/ui/components/select";
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
import { Edit, Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/concerts")({
  component: ConcertsComponent,
});

function CreateConcertForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: venues, isLoading: venuesLoading } = useQuery(
    orpc.venue.list.queryOptions()
  );
  const { data: organizers, isLoading: organizersLoading } = useQuery(
    orpc.organizer.list.queryOptions()
  );
  const createMutation = useMutation(orpc.concert.create.mutationOptions());
  const queryClient = useQueryClient();

  if (venuesLoading || organizersLoading) {
    return (
      <div className="p-4 text-muted-foreground text-sm">Loading form...</div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      posterUrl: formData.get("posterUrl") as string,
      organizedBy: formData.get("organizedBy") as string,
      venueId: formData.get("venueId") as string,
    };

    try {
      await createMutation.mutateAsync({
        ...data,
        posterUrl: data.posterUrl || undefined,
      });
      toast.success("Concert created successfully");
      queryClient.invalidateQueries({
        queryKey: orpc.concert.list.queryOptions().queryKey,
      });
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create concert"
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
        <FieldLabel>Description</FieldLabel>
        <Input name="description" required />
      </Field>
      <Field>
        <FieldLabel>Poster URL</FieldLabel>
        <Input name="posterUrl" type="url" />
      </Field>
      <Field>
        <FieldLabel>Organizer</FieldLabel>
        <Select defaultValue="" name="organizedBy" required>
          <SelectTrigger>
            <SelectValue placeholder="Select Organizer" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {organizers?.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Venue</FieldLabel>
        <Select defaultValue="" name="venueId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {venues?.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Button disabled={createMutation.isPending} type="submit">
        {createMutation.isPending ? "Creating..." : "Create Concert"}
      </Button>
    </form>
  );
}

interface Concert {
  description: string;
  id: string;
  name: string;
  organizedBy: string;
  posterUrl: string | null;
  status: "draft" | "published" | "completed" | "cancelled";
  venueId: string;
}

function EditConcertForm({
  concert,
  onSuccess,
}: {
  concert: Concert;
  onSuccess: () => void;
}) {
  const { data: venues, isLoading: venuesLoading } = useQuery(
    orpc.venue.list.queryOptions()
  );
  const { data: organizers, isLoading: organizersLoading } = useQuery(
    orpc.organizer.list.queryOptions()
  );
  const updateMutation = useMutation(orpc.concert.update.mutationOptions());
  const queryClient = useQueryClient();

  if (venuesLoading || organizersLoading) {
    return (
      <div className="p-4 text-muted-foreground text-sm">Loading form...</div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: concert.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      posterUrl: formData.get("posterUrl") as string,
      organizedBy: formData.get("organizedBy") as string,
      venueId: formData.get("venueId") as string,
      status: formData.get("status") as Concert["status"],
    };

    try {
      await updateMutation.mutateAsync({
        ...data,
        posterUrl: data.posterUrl || undefined,
      });
      toast.success("Concert updated successfully");
      queryClient.invalidateQueries({
        queryKey: orpc.concert.list.queryOptions().queryKey,
      });
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update concert"
      );
    }
  };

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input defaultValue={concert.name} name="name" required />
      </Field>
      <Field>
        <FieldLabel>Description</FieldLabel>
        <Input defaultValue={concert.description} name="description" required />
      </Field>
      <Field>
        <FieldLabel>Poster URL</FieldLabel>
        <Input
          defaultValue={concert.posterUrl || ""}
          name="posterUrl"
          type="url"
        />
      </Field>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select defaultValue={concert.status} name="status" required>
          <SelectTrigger>
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Organizer</FieldLabel>
        <Select defaultValue={concert.organizedBy} name="organizedBy" required>
          <SelectTrigger>
            <SelectValue placeholder="Select Organizer" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {organizers?.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Venue</FieldLabel>
        <Select defaultValue={concert.venueId} name="venueId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {venues?.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Button disabled={updateMutation.isPending} type="submit">
        {updateMutation.isPending ? "Updating..." : "Update Concert"}
      </Button>
    </form>
  );
}

function ManageShowtimesPanel({
  concertId,
  venueId,
}: {
  concertId: string;
  venueId: string;
}) {
  const { data: showtimes, isLoading } = useQuery(
    orpc.showtime.list.queryOptions({ input: { concertId } })
  );
  const createMutation = useMutation(orpc.showtime.create.mutationOptions());
  const deleteMutation = useMutation(orpc.showtime.delete.mutationOptions());
  const queryClient = useQueryClient();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const showDatetime = formData.get("showDatetime") as string;

    try {
      await createMutation.mutateAsync({
        concertId,
        venueId,
        showDatetime: new Date(showDatetime),
        status: "upcoming",
      });
      toast.success("Showtime created successfully");
      queryClient.invalidateQueries({
        queryKey: orpc.showtime.list.queryOptions({ input: { concertId } })
          .queryKey,
      });
      e.currentTarget.reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create showtime"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Showtime deleted");
      queryClient.invalidateQueries({
        queryKey: orpc.showtime.list.queryOptions({ input: { concertId } })
          .queryKey,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete showtime"
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="space-y-4">
        <h3 className="font-medium text-sm">Add New Showtime</h3>
        <form className="flex flex-col gap-3" onSubmit={handleCreate}>
          <Field>
            <FieldLabel>Show Datetime</FieldLabel>
            <Input name="showDatetime" required type="datetime-local" />
          </Field>
          <Button disabled={createMutation.isPending} type="submit">
            {createMutation.isPending ? "Adding..." : "Add Showtime"}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-sm">Existing Showtimes</h3>
        {isLoading && (
          <p className="text-muted-foreground text-sm">Loading showtimes...</p>
        )}
        {!isLoading && showtimes?.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No showtimes found for this concert.
          </p>
        )}
        {!isLoading && showtimes && showtimes.length > 0 && (
          <div className="space-y-2">
            {showtimes.map((showtime) => (
              <div
                className="flex items-center justify-between rounded-md border border-border p-3"
                key={showtime.id}
              >
                <div>
                  <p className="font-medium text-sm">
                    {new Date(showtime.showDatetime).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-muted-foreground text-xs uppercase tracking-wider">
                    {showtime.status}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        disabled={deleteMutation.isPending}
                        size="icon-sm"
                        variant="destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Showtime</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this showtime? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(showtime.id)}
                        variant="destructive"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConcertRowActions({ concert }: { concert: Concert }) {
  const deleteConcertMutation = useMutation(
    orpc.concert.delete.mutationOptions()
  );
  const queryClient = useQueryClient();
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteConcertMutation.mutateAsync({ id: concert.id });
      toast.success("Concert deleted");
      queryClient.invalidateQueries({
        queryKey: orpc.concert.list.queryOptions().queryKey,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete concert"
      );
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Sheet onOpenChange={setEditSheetOpen} open={editSheetOpen}>
        <SheetTrigger
          render={
            <Button size="icon-sm" title="Edit Concert" variant="secondary">
              <Edit className="size-4" />
            </Button>
          }
        />
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Concert</SheetTitle>
            <SheetDescription>
              Update the details for {concert.name}.
            </SheetDescription>
          </SheetHeader>
          <EditConcertForm
            concert={concert}
            onSuccess={() => setEditSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger
          render={
            <Button size="sm" variant="secondary">
              <Settings2 className="mr-2 size-4" />
              Showtimes
            </Button>
          }
        />
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Manage Showtimes</SheetTitle>
            <SheetDescription>
              Add or remove showtimes for {concert.name}.
            </SheetDescription>
          </SheetHeader>
          <ManageShowtimesPanel
            concertId={concert.id}
            venueId={concert.venueId}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              disabled={deleteConcertMutation.isPending}
              size="icon-sm"
              variant="destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Concert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this concert? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ConcertsComponent() {
  const { data: concerts, isLoading } = useQuery(
    orpc.concert.list.queryOptions()
  );
  const { data: venues } = useQuery(orpc.venue.list.queryOptions());
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const getVenueName = (venueId: string) =>
    venues?.find((v) => v.id === venueId)?.name || venueId;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Concerts</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your concerts and their showtimes here.
          </p>
        </div>
        <Sheet onOpenChange={setCreateSheetOpen} open={createSheetOpen}>
          <SheetTrigger
            render={
              <Button>
                <Plus className="mr-2 size-4" />
                New Concert
              </Button>
            }
          />
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Concert</SheetTitle>
              <SheetDescription>
                Fill in the details to create a new concert.
              </SheetDescription>
            </SheetHeader>
            <CreateConcertForm onSuccess={() => setCreateSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-lg">All Concerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    className="py-8 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    Loading concerts...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && concerts?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="py-8 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    No concerts found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                concerts?.map((concert) => (
                  <TableRow key={concert.id}>
                    <TableCell className="pl-6 font-medium">
                      {concert.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getVenueName(concert.venueId)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs capitalize">
                        {concert.status}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <ConcertRowActions concert={concert as Concert} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
