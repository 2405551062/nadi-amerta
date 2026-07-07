"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel } from "@/components/ops/ui";
import { StatusBadge } from "@/components/status-badge";
import { Surface } from "@/components/motion";
import { useRouter } from "next/navigation";
import type { HousekeepingTask, VillaStatus, Villa } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Status ladder — tap advances; regress requires long-press in production (design/07 §3.1). */
const LADDER: VillaStatus[] = ["cleaning", "inspection", "available"];

function nextStatus(s: VillaStatus): VillaStatus | null {
  const i = LADDER.indexOf(s);
  return i >= 0 && i < LADDER.length - 1 ? LADDER[i + 1] : s === "cleaning" ? "inspection" : null;
}

export function HousekeepingBoard({
  villas,
  tasks: initialTasks,
}: {
  villas: Villa[];
  tasks: HousekeepingTask[];
}) {
  const router = useRouter();
  const idBySlug = Object.fromEntries(villas.map((v) => [v.slug, v.id]));
  const nameBySlug = Object.fromEntries(villas.map((v) => [v.slug, v.name]));
  const [statuses, setStatuses] = useState<Record<string, VillaStatus>>(
    Object.fromEntries(villas.map((v) => [v.slug, v.status]))
  );
  const [tasks, setTasks] = useState<HousekeepingTask[]>(initialTasks);
  const [openTask, setOpenTask] = useState<HousekeepingTask | null>(null);

  const advance = async (slug: string) => {
    const cur = statuses[slug];
    const next = nextStatus(cur);
    if (!next) return;
    // POST /api/ops/villa-status → writes product.template.x_availability (B25 → B10)
    setStatuses((s) => ({ ...s, [slug]: next }));
    toast(`${nameBySlug[slug]} → ${next}`, {
      description: next === "available" ? "Ready for sale — reception can check in." : undefined,
    });
    try {
      await fetch("/api/ops/villa-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: idBySlug[slug], status: next }),
      });
      router.refresh();
    } catch {
      toast("Could not update status — please try again.");
    }
  };

  const toggleItem = (taskId: number, index: number) => {
    // Persist the toggle in Odoo (checklist_json); server auto-advances on all-done.
    let becameAllDone = false;
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== taskId) return t;
        const checklist = t.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c));
        const allDone = checklist.length > 0 && checklist.every((c) => c.done);
        if (allDone && t.state !== "done") becameAllDone = true;
        return { ...t, checklist, state: allDone ? "doing" : t.state };
      })
    );
    setOpenTask((cur) =>
      cur && cur.id === taskId
        ? { ...cur, checklist: cur.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c)) }
        : cur
    );
    fetch(`/api/ops/tasks/${taskId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    })
      .then(() => {
        if (becameAllDone) {
          const task = tasks.find((t) => t.id === taskId);
          if (task) advance(task.villaSlug);
          router.refresh();
        }
      })
      .catch(() => toast("Could not save — please try again."));
  };

  return (
    <Surface className="space-y-6 p-6 lg:p-10">
      {/* Villa board — 56px thumb-first controls (design/07 §3) */}
      <Panel title="Villa board">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {villas.map((v) => {
            const s = statuses[v.slug];
            const locked = s === "occupied" || s === "maintenance";
            return (
              <motion.li key={v.slug} layout className="rounded-lg border border-border p-5">
                <p className="font-display text-xl text-teal-700">{v.name}</p>
                <div className="mt-3">
                  <StatusBadge status={s} />
                </div>
                {locked ? (
                  <p className="mt-4 text-xs text-stone-500">
                    {s === "occupied" ? `${v.currentGuest ?? "Guest"} · DND respected` : "With engineering"}
                  </p>
                ) : s === "available" ? (
                  <p className="mt-4 text-xs font-medium text-sage-500">Ready for sale ✓</p>
                ) : (
                  <button
                    onClick={() => advance(v.slug)}
                    className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98]"
                  >
                    Mark {nextStatus(s)} <ChevronRight className="size-4" aria-hidden />
                  </button>
                )}
              </motion.li>
            );
          })}
        </ul>
      </Panel>

      {/* Task queue — B24 */}
      <Panel title="Today's tasks">
        <ul className="divide-y divide-border">
          {tasks.map((t) => {
            const vName = nameBySlug[t.villaSlug] ?? t.villaSlug;
            const doneCount = t.checklist.filter((c) => c.done).length;
            const overdue = t.due <= "13:00" && t.state !== "done";
            return (
              <li key={t.id}>
                <button
                  onClick={() => setOpenTask(t)}
                  className="flex w-full flex-wrap items-center gap-4 py-4 text-left transition-colors hover:bg-ivory-200/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">
                      {vName} · {t.type}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {t.assignee} · {doneCount}/{t.checklist.length} items
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      overdue ? "bg-terracotta-100 text-terracotta-500" : "bg-sand-300 text-stone-600"
                    )}
                  >
                    due {t.due}
                  </span>
                  <StatusBadge
                    status={t.state === "done" ? "resolved" : t.state === "doing" ? "in_progress" : "open"}
                    label={t.state === "done" ? "Done" : t.state === "doing" ? "In progress" : "To do"}
                  />
                  <ChevronRight className="size-4 text-stone-400" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* Checklist sheet — photo-proof pattern (design/07 §3.2) */}
      <Sheet open={!!openTask} onOpenChange={(o) => !o && setOpenTask(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
          {openTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-display-sm font-medium text-teal-700">
                  {nameBySlug[openTask.villaSlug] ?? openTask.villaSlug} · {openTask.type}
                </SheetTitle>
                <SheetDescription>
                  {openTask.assignee} · due {openTask.due}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-8">
                {openTask.checklist.map((c, i) => (
                  <label
                    key={c.label}
                    className="flex min-h-14 items-center gap-4 rounded-md border border-border px-4 text-sm"
                  >
                    <Checkbox checked={c.done} onCheckedChange={() => toggleItem(openTask.id, i)} className="size-5" />
                    <span className={cn(c.done && "text-stone-500 line-through")}>{c.label}</span>
                  </label>
                ))}
                <button className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-md border border-dashed border-sand-400 text-sm font-medium text-stone-600 transition-colors hover:border-palm-700">
                  <Camera className="size-4" aria-hidden /> Add inspection photos
                </button>
                <p className="pt-1 text-xs text-stone-500">
                  Completing every item marks the villa for inspection automatically.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Surface>
  );
}
