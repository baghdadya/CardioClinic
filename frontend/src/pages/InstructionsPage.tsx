import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, FileText, X, Plus, Pencil, Trash2, Eye, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/* ---------- Types ---------- */

interface Instruction {
  id: string;
  title_en: string;
  title_ar: string | null;
  content_en: string;
  content_ar: string | null;
  category: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  category: string;
  sort_order: number;
}

const emptyForm: FormData = {
  title_en: "",
  title_ar: "",
  content_en: "",
  content_ar: "",
  category: "",
  sort_order: 0,
};

const CATEGORIES = ["All", "General", "Diet", "Exercise", "Medication", "Procedure"];

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Diet: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Exercise: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Medication: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Procedure: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const DOCTOR_HEADER = `<div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #1e3a5f;padding-bottom:16px;">
  <h1 style="margin:0;font-size:20px;color:#1e3a5f;font-weight:bold;">Dr. Yasser M.K. Baghdady, MD</h1>
  <p style="margin:4px 0 0;font-size:14px;color:#444;">Lecturer of Cardiovascular Medicine</p>
  <p style="margin:2px 0 0;font-size:14px;color:#444;">Faculty of Medicine - Cairo University</p>
</div>`;

const DOCTOR_FOOTER = `<div style="text-align:center;margin-top:32px;border-top:2px solid #1e3a5f;padding-top:16px;font-size:13px;color:#444;">
  <p style="margin:0;">9 Horrya Square, Maadi</p>
  <p style="margin:4px 0 0;">Mobile: 010/1434754 | Tel: 3519561</p>
  <p style="margin:4px 0 0;">yasserbaghdady@hotmail.com</p>
</div>`;

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/* ---------- Instruction Form Dialog ---------- */

function InstructionFormDialog({
  open,
  onClose,
  initial,
  instructionId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: FormData;
  instructionId: string | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title_en.trim()) {
      toast({ variant: "error", title: "English title is required" });
      return;
    }
    if (!form.content_en.trim()) {
      toast({ variant: "error", title: "English content is required" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title_en: form.title_en.trim(),
        title_ar: form.title_ar.trim() || undefined,
        content_en: form.content_en.trim(),
        content_ar: form.content_ar.trim() || undefined,
        category: form.category.trim() || undefined,
        sort_order: form.sort_order,
      };

      if (instructionId) {
        await api.patch(`/instructions/${instructionId}`, payload);
        toast({ variant: "success", title: "Instruction updated" });
      } else {
        await api.post("/instructions", payload);
        toast({ variant: "success", title: "Instruction created" });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save instruction";
      toast({ variant: "error", title: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>
          {instructionId ? "Edit Instruction" : "Add Instruction"}
        </DialogTitle>
        <DialogDescription>
          {instructionId
            ? "Update the patient instruction details below."
            : "Create a new bilingual patient instruction template."}
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto">
        <Input
          label="Title (English) *"
          value={form.title_en}
          onChange={set("title_en")}
          placeholder="e.g. Basic Health Rules"
        />
        <Input
          label="Title (Arabic)"
          value={form.title_ar}
          onChange={set("title_ar")}
          placeholder="e.g. القواعد الأساسية للحياة الصحية"
          dir="rtl"
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            value={form.category}
            onChange={set("category")}
            className={cn(
              "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground",
              "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            )}
          >
            <option value="">-- Select Category --</option>
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Content (English) *
          </label>
          <textarea
            value={form.content_en}
            onChange={set("content_en")}
            placeholder="HTML content for the English instruction..."
            rows={8}
            className={cn(
              "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground font-mono",
              "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              "resize-y"
            )}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Content (Arabic)
          </label>
          <textarea
            value={form.content_ar}
            onChange={set("content_ar")}
            placeholder="HTML content for the Arabic instruction (RTL)..."
            rows={8}
            dir="rtl"
            className={cn(
              "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground font-mono",
              "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              "resize-y"
            )}
          />
        </div>
        <Input
          label="Sort Order"
          type="number"
          value={String(form.sort_order)}
          onChange={(e) => setForm((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
        />
      </DialogContent>
      <DialogFooter>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={cn(
            "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors",
            "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? "Saving..." : instructionId ? "Update" : "Create"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- Preview / Print Dialog ---------- */

function PreviewDialog({
  open,
  onClose,
  instruction,
}: {
  open: boolean;
  onClose: () => void;
  instruction: Instruction | null;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!instruction) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${instruction.title_en}</title>
  <style>
    @page { margin: 20mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #222; line-height: 1.6; margin: 0; padding: 0; }
    h1, h2, h3 { color: #1e3a5f; }
    ul, ol { padding-left: 24px; }
    .en-section { margin-bottom: 32px; }
    .ar-section { direction: rtl; text-align: right; margin-bottom: 32px; }
    .divider { border: none; border-top: 1px dashed #999; margin: 24px 0; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
    th { background: #f0f4f8; }
  </style>
</head>
<body>
  ${content.innerHTML}
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Preview: {instruction.title_en}</DialogTitle>
        <DialogDescription>
          This is how the instruction will appear when printed.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <div
          ref={printRef}
          className="rounded-lg border border-border bg-white p-6 text-black"
          style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", lineHeight: 1.6 }}
        >
          {/* Doctor Header */}
          <div dangerouslySetInnerHTML={{ __html: DOCTOR_HEADER }} />

          {/* English Section */}
          <div className="en-section" style={{ marginBottom: 24 }}>
            <h2 style={{ color: "#1e3a5f", borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 16 }}>
              {instruction.title_en}
            </h2>
            <div dangerouslySetInnerHTML={{ __html: instruction.content_en }} />
          </div>

          {/* Divider */}
          {instruction.content_ar && (
            <>
              <hr style={{ border: "none", borderTop: "1px dashed #999", margin: "24px 0" }} />

              {/* Arabic Section */}
              <div dir="rtl" lang="ar" style={{ textAlign: "right", marginBottom: 24 }}>
                <h2 style={{ color: "#1e3a5f", borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 16 }}>
                  {instruction.title_ar}
                </h2>
                <div dangerouslySetInnerHTML={{ __html: instruction.content_ar }} />
              </div>
            </>
          )}

          {/* Doctor Footer */}
          <div dangerouslySetInnerHTML={{ __html: DOCTOR_FOOTER }} />
        </div>
      </DialogContent>
      <DialogFooter>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "transition-colors hover:bg-primary/90"
          )}
        >
          <Printer size={16} />
          Print
        </button>
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- Delete Confirmation Dialog ---------- */

function DeleteDialog({
  open,
  onClose,
  instruction,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  instruction: Instruction | null;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  if (!instruction) return null;

  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Delete Instruction</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{instruction.title_en}"? This will hide it from the active list.
        </DialogDescription>
      </DialogHeader>
      <DialogContent />
      <DialogFooter>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors",
            "hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- Main Page ---------- */

export default function InstructionsPage() {
  const { toast } = useToast();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInstruction, setPreviewInstruction] = useState<Instruction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingInstruction, setDeletingInstruction] = useState<Instruction | null>(null);

  const fetchInstructions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeCategory !== "All") params.category = activeCategory;
      const { data } = await api.get("/instructions", { params });
      const items: Instruction[] = Array.isArray(data) ? data : data.items ?? [];
      setInstructions(items);
    } catch {
      setInstructions([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  const filtered = instructions.filter((inst) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inst.title_en.toLowerCase().includes(q) ||
      inst.title_ar?.toLowerCase().includes(q) ||
      inst.category?.toLowerCase().includes(q)
    );
  });

  const openEdit = (inst: Instruction) => {
    setEditingInstruction(inst);
    setEditOpen(true);
  };

  const openPreview = async (inst: Instruction) => {
    try {
      const { data } = await api.get(`/instructions/${inst.id}`);
      setPreviewInstruction(data);
      setPreviewOpen(true);
    } catch {
      toast({ variant: "error", title: "Failed to load instruction" });
    }
  };

  const openDelete = (inst: Instruction) => {
    setDeletingInstruction(inst);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingInstruction) return;
    try {
      await api.delete(`/instructions/${deletingInstruction.id}`);
      toast({ variant: "success", title: "Instruction deleted" });
      setDeleteOpen(false);
      setDeletingInstruction(null);
      fetchInstructions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete instruction";
      toast({ variant: "error", title: message });
    }
  };

  const editInitial: FormData = editingInstruction
    ? {
        title_en: editingInstruction.title_en,
        title_ar: editingInstruction.title_ar ?? "",
        content_en: editingInstruction.content_en,
        content_ar: editingInstruction.content_ar ?? "",
        category: editingInstruction.category ?? "",
        sort_order: editingInstruction.sort_order,
      }
    : emptyForm;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Patient Instructions
          </h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} instruction{filtered.length !== 1 && "s"}
            {activeCategory !== "All" && ` in ${activeCategory}`}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "transition-colors hover:bg-primary/90"
          )}
        >
          <Plus size={16} />
          Add Instruction
        </button>
      </div>

      {/* Category Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search instructions..."
          className={cn(
            "w-full rounded-xl border border-input bg-card py-2.5 pl-11 pr-10 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          )}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Instructions Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="mb-3 h-5 w-3/4" />
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="mb-4 h-16 w-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {search ? "No instructions match your search" : "No instructions found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search terms"
                : "Add your first patient instruction template"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((inst) => (
              <motion.div
                key={inst.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Title */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground leading-tight">
                    {inst.title_en}
                  </h3>
                  {inst.category && (
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                        CATEGORY_COLORS[inst.category] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      )}
                    >
                      {inst.category}
                    </span>
                  )}
                </div>

                {/* Arabic title */}
                {inst.title_ar && (
                  <p className="mb-3 text-sm text-muted-foreground" dir="rtl">
                    {inst.title_ar}
                  </p>
                )}

                {/* Content preview */}
                <p className="mb-4 line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                  {stripHtml(inst.content_en).slice(0, 150)}
                  {stripHtml(inst.content_en).length > 150 && "..."}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPreview(inst)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground",
                      "transition-colors hover:bg-secondary hover:text-foreground"
                    )}
                    title="Preview"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => openEdit(inst)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground",
                      "transition-colors hover:bg-secondary hover:text-foreground"
                    )}
                    title="Edit"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => openDelete(inst)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500",
                      "transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                    )}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Dialog */}
      <InstructionFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initial={emptyForm}
        instructionId={null}
        onSaved={fetchInstructions}
      />

      {/* Edit Dialog */}
      <InstructionFormDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingInstruction(null);
        }}
        initial={editInitial}
        instructionId={editingInstruction?.id ?? null}
        onSaved={fetchInstructions}
      />

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewInstruction(null);
        }}
        instruction={previewInstruction}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingInstruction(null);
        }}
        instruction={deletingInstruction}
        onConfirm={handleDelete}
      />
    </div>
  );
}
