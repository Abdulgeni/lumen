import type { ReactNode } from "react";
import { Panel } from "@/components/app/panel";

export function SettingsSection({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <Panel className={`space-y-5 p-6 sm:p-8 ${danger ? "border-red-900/50" : ""}`}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </Panel>
  );
}
