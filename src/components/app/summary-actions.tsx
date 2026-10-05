"use client";

import { Check, Copy, Download, Pencil, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/api-client";
import { ROUTES } from "@/lib/routes";

type Props = { id: string; title: string; isFavorite: boolean; markdown: string };

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "summary";

export function SummaryActions({ id, title, isFavorite, markdown }: Props) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(isFavorite);
  const [copied, setCopied] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copying is not available in this browser.");
    }
  }

  function download() {
    const url = URL.createObjectURL(
      new Blob([`# ${title}\n\n${markdown}\n`], { type: "text/markdown" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug(title)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    const result = await apiRequest(`/api/summaries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isFavorite: next }),
    });
    if (!result.ok) {
      setFavorite(!next);
      toast.error(result.message);
    } else {
      router.refresh();
    }
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    if (!value) return;
    setBusy(true);
    const result = await apiRequest(`/api/summaries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: value }),
    });
    setBusy(false);
    if (!result.ok) return void toast.error(result.message);
    setRenameOpen(false);
    toast.success("Renamed.");
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const result = await apiRequest(`/api/summaries/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!result.ok) return void toast.error(result.message);
    toast.success("Summary deleted.");
    router.replace(ROUTES.archive);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-4 text-gold" /> : <Copy className="size-4" />}{" "}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="outline" size="sm" onClick={download}>
          <Download className="size-4" /> Download
        </Button>
        <Button variant="outline" size="sm" onClick={toggleFavorite} aria-pressed={favorite}>
          <Star className={favorite ? "size-4 fill-gold text-gold" : "size-4"} />{" "}
          {favorite ? "Favorited" : "Favorite"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setRenameOpen(true)}>
          <Pencil className="size-4" /> Rename
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="text-red-300 hover:text-red-200"
        >
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename summary">
        <form onSubmit={rename} className="space-y-4">
          <Input name="title" defaultValue={title} maxLength={120} required aria-label="Title" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this summary?"
        description="This cannot be undone. Deleting does not give back the credit it used."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
