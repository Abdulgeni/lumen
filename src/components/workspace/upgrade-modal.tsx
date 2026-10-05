"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/format";
import { getPlan, type PlanId } from "@/lib/plans";
import { ROUTES } from "@/lib/routes";

export type UpgradeInfo = {
  code: string;
  message: string;
  upgradeTo: PlanId | null;
  resetsAt?: string;
};

export function UpgradeModal({
  info,
  onClose,
}: {
  info: UpgradeInfo | undefined;
  onClose: () => void;
}) {
  const target = info?.upgradeTo ? getPlan(info.upgradeTo) : null;
  return (
    <Modal
      open={Boolean(info)}
      onClose={onClose}
      title={
        info?.code === "QUOTA_EXCEEDED" ? "You have reached your limit" : "Available on paid plans"
      }
      description={info?.message}
    >
      <div className="space-y-4">
        {target ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {target.name} includes {target.monthlySummaries.toLocaleString("en-US")} summaries a
            month, up to {target.maxInputWords.toLocaleString("en-US")} words per document, file
            uploads, and Deep Dive.
          </p>
        ) : null}
        {info?.resetsAt ? (
          <p className="text-xs text-muted-foreground">
            Your quota resets on {formatDate(new Date(info.resetsAt))}.
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <Link href={ROUTES.billing} className={buttonVariants()}>
            See plans
          </Link>
        </div>
      </div>
    </Modal>
  );
}
