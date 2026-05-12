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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Edit,
  Music,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/concerts")({
  component: ConcertsComponent,
});

function getConcertStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case "published":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "draft":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "completed":
      return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "cancelled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

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
      <Button
        className="mt-2 h-10 rounded-md"
        disabled={createMutation.isPending}
        type="submit"
      >
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
      <Button
        className="mt-2 h-10 rounded-md"
        disabled={updateMutation.isPending}
        type="submit"
      >
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
    const form = e.currentTarget;
    const formData = new FormData(form);
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
      form.reset();
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
        <h3 className="font-medium text-sm">Add new showtime</h3>
        <form className="flex flex-col gap-3" onSubmit={handleCreate}>
          <Field>
            <FieldLabel>Show Datetime</FieldLabel>
            <Input name="showDatetime" required type="datetime-local" />
          </Field>
          <Button
            className="h-10 rounded-md"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? "Adding..." : "Add Showtime"}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-sm">Existing showtimes</h3>
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
                className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3"
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

function ConcertRowActions({
  concert,
  onEdit,
}: {
  concert: Concert;
  onEdit: (concert: Concert) => void;
}) {
  const deleteConcertMutation = useMutation(
    orpc.concert.delete.mutationOptions()
  );
  const queryClient = useQueryClient();

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
      <Button
        onClick={() => onEdit(concert)}
        size="icon-sm"
        title="Edit Concert"
        variant="secondary"
      >
        <Edit className="size-4" />
      </Button>

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
  const [editingConcert, setEditingConcert] = useState<Concert | null>(null);

  const getVenueName = useCallback(
    (venueId: string) => venues?.find((v) => v.id === venueId)?.name || venueId,
    [venues]
  );

  const columns = useMemo<ColumnDef<Concert>[]>(
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
        accessorKey: "venueId",
        header: "Venue",
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {getVenueName(row.getValue("venueId"))}
          </div>
        ),
      },
      {
        accessorKey: "status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 font-medium text-[11px] uppercase tracking-[0.16em] ${getConcertStatusClasses(row.getValue("status"))}`}
          >
            {row.getValue("status")}
          </span>
        ),
        header: "Status",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <ConcertRowActions
              concert={row.original as Concert}
              onEdit={setEditingConcert}
            />
          </div>
        ),
      },
    ],
    [getVenueName]
  );

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section className="rounded-lg border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Music className="size-4 text-foreground" />
                Concert catalog
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Shape the shows customers can discover and book.
              </p>
            </div>
            <Sheet onOpenChange={setCreateSheetOpen} open={createSheetOpen}>
              <SheetTrigger
                render={
                  <Button className="h-11 rounded-md">
                    <Plus className="size-4" />
                    New concert
                  </Button>
                }
              />
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create concert</SheetTitle>
                  <SheetDescription>
                    Fill in the details to create a new concert.
                  </SheetDescription>
                </SheetHeader>
                <CreateConcertForm
                  onSuccess={() => setCreateSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Total concerts</p>
              <p className="mt-2 font-semibold text-3xl tabular-nums">
                {(concerts?.length ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Published</p>
              <p className="mt-2 font-semibold text-3xl tabular-nums">
                {(
                  concerts?.filter((concert) => concert.status === "published")
                    .length ?? 0
                ).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Drafts</p>
              <p className="mt-2 font-semibold text-3xl tabular-nums">
                {(
                  concerts?.filter((concert) => concert.status === "draft")
                    .length ?? 0
                ).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="border-border/70 border-b px-6 py-5">
            <CardTitle className="text-xl">All concerts</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Loading concerts...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={(concerts as Concert[]) ?? []}
                searchKey="name"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet
        onOpenChange={(open) => !open && setEditingConcert(null)}
        open={!!editingConcert}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Concert</SheetTitle>
            <SheetDescription>
              Update the details for {editingConcert?.name}.
            </SheetDescription>
          </SheetHeader>
          {editingConcert && (
            <EditConcertForm
              concert={editingConcert}
              onSuccess={() => setEditingConcert(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
