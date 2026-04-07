import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  Download,
  Mail,
  MessageCircle,
  Ban,
  FileCheck,
} from "lucide-react";

import api from "@/services/api";
import type { Prescription } from "@/types";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PrescriptionViewProps {
  patientId: string;
  prescription: Prescription;
  patientName: string;
  onUpdate: () => void;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  finalized: "bg-emerald-100 text-emerald-800 border-emerald-200",
  voided: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        statusStyles[status] ?? "bg-secondary text-secondary-foreground border-border"
      )}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PrescriptionView({
  patientId,
  prescription: rx,
  patientName,
  onUpdate,
}: PrescriptionViewProps) {
  const { toast } = useToast();

  const [finalizing, setFinalizing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [voiding, setVoiding] = useState(false);

  // Dialog states
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  const basePath = `/patients/${patientId}/prescriptions/${rx.id}`;
  const isDraft = rx.status === "draft";
  const isFinalized = rx.status === "finalized";

  // ---- Actions ----

  async function handleFinalize() {
    setFinalizing(true);
    try {
      await api.post(`${basePath}/finalize`);
      toast({ variant: "success", title: "Prescription finalized" });
      onUpdate();
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Failed to finalize",
        description: err.response?.data?.detail ?? "Something went wrong.",
      });
    } finally {
      setFinalizing(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const { data } = await api.post(`${basePath}/pdf`, null, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription_${rx.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ variant: "success", title: "PDF downloaded" });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "PDF generation failed",
        description: err.response?.data?.detail ?? "Something went wrong.",
      });
    } finally {
      setDownloading(false);
    }
  }

  async function handleEmailSend() {
    setEmailing(true);
    try {
      await api.post(`${basePath}/email`, {
        email_override: emailAddress || undefined,
      });
      toast({ variant: "success", title: "Prescription emailed to patient" });
      setEmailDialogOpen(false);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Email failed",
        description: err.response?.data?.detail ?? "Something went wrong.",
      });
    } finally {
      setEmailing(false);
    }
  }

  function handleWhatsApp() {
    const lines = rx.items.map(
      (item, i) =>
        `${i + 1}. ${item.dosage} - ${item.frequency}${item.duration ? ` for ${item.duration}` : ""}`
    );
    const message = [
      `Your prescription from Maadi Clinic - Dr. ${rx.prescribed_by}`,
      "",
      ...lines,
      "",
      rx.notes ? `Notes: ${rx.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleVoid() {
    if (!voidReason.trim()) return;
    setVoiding(true);
    try {
      await api.post(`${basePath}/void`, { reason: voidReason.trim() });
      toast({ variant: "success", title: "Prescription voided" });
      setVoidDialogOpen(false);
      setVoidReason("");
      onUpdate();
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Failed to void",
        description: err.response?.data?.detail ?? "Something went wrong.",
      });
    } finally {
      setVoiding(false);
    }
  }

  // ---- Render ----

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-border bg-card shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Prescription &mdash;{" "}
              {new Date(rx.prescribed_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={rx.status}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <StatusBadge status={rx.status} />
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="text-xs text-muted-foreground">
            by {rx.prescribed_by}
          </span>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-2">#</th>
                <th className="px-5 py-2">Medication</th>
                <th className="px-5 py-2">Dosage</th>
                <th className="px-5 py-2">Frequency</th>
                <th className="px-5 py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rx.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-5 py-2.5 text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-2.5 font-medium text-foreground">
                    {item.medication_id}
                  </td>
                  <td className="px-5 py-2.5">{item.dosage}</td>
                  <td className="px-5 py-2.5">{item.frequency}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">
                    {item.duration ?? "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {rx.notes && (
          <div className="border-t border-border px-5 py-3">
            <p className="text-xs font-medium text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm text-foreground">{rx.notes}</p>
          </div>
        )}

        {/* Void reason (if voided) */}
        {rx.status === "voided" && rx.void_reason && (
          <div className="border-t border-border bg-red-50/50 px-5 py-3">
            <p className="text-xs font-medium text-red-700">Void Reason</p>
            <p className="mt-1 text-sm text-red-800">{rx.void_reason}</p>
          </div>
        )}

        {/* Action bar */}
        {(isDraft || isFinalized) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
            {isDraft && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  loading={finalizing}
                  onClick={handleFinalize}
                >
                  <FileCheck size={16} />
                  Finalize
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setVoidDialogOpen(true)}
                >
                  <Ban size={16} />
                  Void
                </Button>
              </>
            )}

            {isFinalized && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={downloading}
                  onClick={handleDownloadPdf}
                >
                  <Download size={16} />
                  Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEmailAddress("");
                    setEmailDialogOpen(true);
                  }}
                >
                  <Mail size={16} />
                  Email to Patient
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </Button>

                <div className="flex-1" />

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setVoidDialogOpen(true)}
                >
                  <Ban size={16} />
                  Void
                </Button>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* ---- Email dialog ---- */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Email Prescription</DialogTitle>
          <DialogDescription>
            Confirm or enter the patient&apos;s email address.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Email address
            </span>
            <input
              type="email"
              className={cn(
                "mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              )}
              placeholder="patient@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
            />
          </label>
        </DialogContent>
        <DialogFooter>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEmailDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button size="sm" loading={emailing} onClick={handleEmailSend}>
            <Mail size={16} />
            Send Email
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ---- Void confirmation dialog ---- */}
      <Dialog open={voidDialogOpen} onClose={() => setVoidDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Void Prescription</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please provide a reason.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Reason</span>
            <textarea
              className={cn(
                "mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring",
                "min-h-[80px] resize-y"
              )}
              placeholder="Reason for voiding this prescription..."
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
          </label>
        </DialogContent>
        <DialogFooter>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setVoidDialogOpen(false);
              setVoidReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            loading={voiding}
            disabled={!voidReason.trim()}
            onClick={handleVoid}
          >
            <Ban size={16} />
            Void Prescription
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
