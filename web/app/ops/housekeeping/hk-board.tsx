"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check, ChevronRight, DoorOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/ops/ui";
import { StatusBadge } from "@/components/status-badge";
import { Surface } from "@/components/motion";
import { useRouter } from "next/navigation";
import type { HousekeepingTask, VillaStatus, Villa } from "@/lib/types";
import { cn } from "@/lib/utils";

type RoomStatus = "ready" | "occupied" | "maintenance";

interface RoomOption {
  id: number;
  code: string;
  villaId: number;
  status: RoomStatus;
}

/** Status ladder — tap advances; regress requires long-press in production (design/07 §3.1). */
const LADDER: VillaStatus[] = ["cleaning", "inspection", "available"];

function nextStatus(s: VillaStatus): VillaStatus | null {
  const i = LADDER.indexOf(s);
  return i >= 0 && i < LADDER.length - 1 ? LADDER[i + 1] : s === "cleaning" ? "inspection" : null;
}

export function HousekeepingBoard({
  villas,
  tasks: initialTasks,
  housekeepers = [],
  rooms = [],
  canManage = false,
}: {
  villas: Villa[];
  tasks: HousekeepingTask[];
  housekeepers?: { id: number; name: string }[];
  rooms?: RoomOption[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const idBySlug = Object.fromEntries(villas.map((v) => [v.slug, v.id]));
  const nameBySlug = Object.fromEntries(villas.map((v) => [v.slug, v.name]));
  const [roomList, setRoomList] = useState<RoomOption[]>(rooms);
  // Note 2 §1 — rooms for the task's villa (room_id points at a real villa.room).
  const roomsForVilla = (slug: string) => roomList.filter((r) => r.villaId === idBySlug[slug]);
  const [statuses, setStatuses] = useState<Record<string, VillaStatus>>(
    Object.fromEntries(villas.map((v) => [v.slug, v.status]))
  );
  const [tasks, setTasks] = useState<HousekeepingTask[]>(initialTasks);
  const [openTask, setOpenTask] = useState<HousekeepingTask | null>(null);
  const [photoDone, setPhotoDone] = useState<Record<string, boolean>>({});
  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newVillaId, setNewVillaId] = useState<number>(villas[0]?.id ?? 0);
  const newRooms = roomList.filter((r) => r.villaId === newVillaId);
  // Villa board — operator clicks a villa to see & set its rooms' status.
  const [roomsVilla, setRoomsVilla] = useState<Villa | null>(null);
  // Housekeeper's completion report draft, keyed by task id.
  const [conclusionDraft, setConclusionDraft] = useState<Record<number, string>>({});
  // Drawer opens on openTask; its body reads the live task from `tasks` so
  // optimistic edits (assign / room / checklist) reflect immediately.
  const liveTask = openTask ? tasks.find((t) => t.id === openTask.id) ?? openTask : null;
  const allChecked = (t: HousekeepingTask) =>
    t.checklist.length > 0 && t.checklist.every((c) => c.done);

  // Note #5 — assign a housekeeper, set the room label, or upload a photo.
  const patchTask = (id: number, body: Record<string, unknown>) =>
    fetch(`/api/ops/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});

  const assign = (id: number, userId: number) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? { ...t, assigneeId: userId, assignee: housekeepers.find((h) => h.id === userId)?.name ?? t.assignee }
          : t
      )
    );
    patchTask(id, { action: "assign", userId });
  };
  const setRoom = (id: number, roomId: number) => {
    const code = roomList.find((r) => r.id === roomId)?.code ?? "";
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, roomId, roomLabel: code } : t)));
    patchTask(id, { action: "room", roomId });
  };

  // Villa board — operator sets a room's status (ready/occupied/maintenance).
  const setRoomStatusFn = (roomId: number, status: RoomStatus) => {
    setRoomList((rs) => rs.map((r) => (r.id === roomId ? { ...r, status } : r)));
    fetch(`/api/ops/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(() => router.refresh())
      .catch(() => toast("Could not update room status — please try again."));
  };

  // Housekeeper signs off: checklist must be complete; submits the conclusion
  // for back office / HR to review.
  const submitConclusion = async (id: number) => {
    const conclusion = conclusionDraft[id] ?? "";
    try {
      const res = await fetch(`/api/ops/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", conclusion }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setTasks((ts) =>
        ts.map((t) => (t.id === id ? { ...t, state: "done", conclusion, submittedAt: "Just now" } : t))
      );
      toast("Report submitted", { description: "Back office can now review it." });
      router.refresh();
    } catch (err) {
      toast("Could not submit", { description: (err as Error).message });
    }
  };

  // Note 2 §2 — admin/manager creates and assigns a housekeeping task.
  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/ops/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: Number(fd.get("villa")),
          taskType: fd.get("type"),
          assigneeId: fd.get("assignee") ? Number(fd.get("assignee")) : undefined,
          roomId: fd.get("room") ? Number(fd.get("room")) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setNewOpen(false);
      toast("Task created", { description: "Assigned and sent to housekeeping." });
      router.refresh();
    } catch (err) {
      toast("Could not create task", { description: (err as Error).message });
    } finally {
      setCreating(false);
    }
  };
  const uploadPhoto = (id: number, which: "before" | "after", file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result).split(",")[1] || "";
      setPhotoDone((p) => ({ ...p, [`${id}-${which}`]: true }));
      patchTask(id, { action: "photo", which, data });
      toast(`${which === "before" ? "Before" : "After"} photo uploaded`);
    };
    reader.readAsDataURL(file);
  };

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
    // openTask is derived from `tasks`, so the drawer updates automatically.
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
      {/* Note 2 §2 — manager creates & assigns a task to a housekeeper + room. */}
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <button className="flex h-11 items-center gap-2 rounded-md bg-palm-700 px-5 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600">
                <Plus className="size-4" aria-hidden /> New task
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[460px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-display-sm font-medium text-teal-700">New housekeeping task</DialogTitle>
                <DialogDescription>Assign a villa, room, and housekeeper — it appears on their board.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={createTask}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] tracking-wide text-stone-500 uppercase">Villa</label>
                    <select
                      name="villa"
                      value={newVillaId}
                      onChange={(e) => setNewVillaId(Number(e.target.value))}
                      className="mt-1 h-11 w-full rounded-md border border-sand-400 bg-white px-2 text-sm text-ink-700"
                    >
                      {villas.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] tracking-wide text-stone-500 uppercase">Room / unit</label>
                    <select name="room" className="mt-1 h-11 w-full rounded-md border border-sand-400 bg-white px-2 text-sm text-ink-700">
                      <option value="">Any / whole villa</option>
                      {newRooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] tracking-wide text-stone-500 uppercase">Type</label>
                    <select name="type" defaultValue="turnover" className="mt-1 h-11 w-full rounded-md border border-sand-400 bg-white px-2 text-sm text-ink-700">
                      <option value="turnover">Turnover</option>
                      <option value="stayover">Stayover</option>
                      <option value="deep">Deep clean</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] tracking-wide text-stone-500 uppercase">Assign to</label>
                    <select name="assignee" className="mt-1 h-11 w-full rounded-md border border-sand-400 bg-white px-2 text-sm text-ink-700">
                      <option value="">Unassigned</option>
                      {housekeepers.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <button
                    type="submit"
                    disabled={creating}
                    className="h-11 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 hover:bg-palm-600 disabled:opacity-60"
                  >
                    {creating ? "Creating…" : "Create & assign task"}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

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
                {/* Click into a villa to see its rooms and set each one's status. */}
                <button
                  onClick={() => setRoomsVilla(v)}
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-sand-400 text-[13px] font-medium text-ink-700 transition-colors hover:border-palm-700"
                >
                  <DoorOpen className="size-3.5" aria-hidden /> Rooms ({roomsForVilla(v.slug).length})
                </button>
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
                      {vName}
                      {t.roomLabel ? <span className="font-mono text-teal-700"> · {t.roomLabel}</span> : null} · {t.type}
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

      {/* Villa board → Rooms sheet — operator clicks a villa to set each room's status. */}
      <Sheet open={!!roomsVilla} onOpenChange={(o) => !o && setRoomsVilla(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[420px]">
          {roomsVilla && (
            <>
              <SheetHeader>
                <SheetTitle className="text-display-sm font-medium text-teal-700">
                  {roomsVilla.name} · Rooms
                </SheetTitle>
                <SheetDescription>
                  Set each room's status — reflected across reception and housekeeping.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-8">
                {roomsForVilla(roomsVilla.slug).length === 0 && (
                  <p className="text-sm text-stone-500">No rooms recorded for this villa yet.</p>
                )}
                {roomsForVilla(roomsVilla.slug).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div className="space-y-1.5">
                      <p className="font-mono text-sm font-medium text-ink-900">{r.code}</p>
                      <StatusBadge
                        status={r.status === "ready" ? "available" : r.status}
                        label={r.status === "ready" ? "Ready" : undefined}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {(["ready", "occupied", "maintenance"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setRoomStatusFn(r.id, st)}
                          aria-pressed={r.status === st}
                          className={cn(
                            "h-8 rounded-md border px-2.5 text-[11px] font-medium capitalize transition-colors",
                            r.status === st
                              ? "border-palm-700 bg-palm-700 text-ivory-50"
                              : "border-sand-400 text-ink-700 hover:border-palm-700"
                          )}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Checklist sheet — photo-proof pattern (design/07 §3.2) */}
      <Sheet open={!!openTask} onOpenChange={(o) => !o && setOpenTask(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
          {liveTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-display-sm font-medium text-teal-700">
                  {nameBySlug[liveTask.villaSlug] ?? liveTask.villaSlug} · {liveTask.type}
                </SheetTitle>
                <SheetDescription>
                  {liveTask.assignee} · due {liveTask.due}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-8">
                {/* Assignment + room (Note #5) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] tracking-wide text-stone-500 uppercase">Assigned to</label>
                    <select
                      value={liveTask.assigneeId ?? ""}
                      onChange={(e) => assign(liveTask.id, Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-md border border-sand-400 bg-white px-2 text-sm text-ink-700"
                    >
                      <option value="">Unassigned</option>
                      {housekeepers.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] tracking-wide text-stone-500 uppercase">Room / unit</label>
                    <select
                      value={liveTask.roomId ?? ""}
                      onChange={(e) => setRoom(liveTask.id, Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-md border border-sand-400 bg-white px-2 text-sm text-ink-700"
                    >
                      <option value="">No room</option>
                      {roomsForVilla(liveTask.villaSlug).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                  {liveTask.checklist.map((c, i) => (
                    <label
                      key={c.label}
                      className="flex min-h-14 items-center gap-4 rounded-md border border-border px-4 text-sm"
                    >
                      <Checkbox checked={c.done} onCheckedChange={() => toggleItem(liveTask.id, i)} className="size-5" />
                      <span className={cn(c.done && "text-stone-500 line-through")}>{c.label}</span>
                    </label>
                  ))}
                </div>

                {/* Before / after inspection photos (Note #5) */}
                <div className="grid grid-cols-2 gap-3">
                  {(["before", "after"] as const).map((which) => {
                    const done = photoDone[`${liveTask.id}-${which}`];
                    return (
                      <label
                        key={which}
                        className={cn(
                          "flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs font-medium transition-colors",
                          done
                            ? "border-palm-700 bg-sage-300/10 text-palm-700"
                            : "border-sand-400 text-stone-600 hover:border-palm-700"
                        )}
                      >
                        {done ? <Check className="size-5" aria-hidden /> : <Camera className="size-5" aria-hidden />}
                        {done
                          ? `${which === "before" ? "Before" : "After"} attached`
                          : `${which === "before" ? "Before" : "After"} photo`}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadPhoto(liveTask.id, which, f);
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
                <p className="pt-1 text-xs text-stone-500">
                  Completing every item marks the villa for inspection automatically.
                </p>

                {/* Housekeeper signs off — back office / HR reviews the report. */}
                <div className="space-y-2 border-t border-border pt-4">
                  <label className="text-[11px] tracking-wide text-stone-500 uppercase">Completion report</label>
                  {liveTask.submittedAt ? (
                    <div className="rounded-md border border-sage-500/30 bg-sage-300/10 p-3 text-sm">
                      <p className="font-medium text-sage-500">Submitted {liveTask.submittedAt}</p>
                      {liveTask.conclusion && <p className="mt-1 text-ink-700">{liveTask.conclusion}</p>}
                    </div>
                  ) : (
                    <>
                      <Textarea
                        rows={3}
                        value={conclusionDraft[liveTask.id] ?? ""}
                        onChange={(e) =>
                          setConclusionDraft((d) => ({ ...d, [liveTask.id]: e.target.value }))
                        }
                        placeholder="Notes for the record — anything HR or the manager should know."
                        className="bg-white"
                      />
                      <button
                        onClick={() => submitConclusion(liveTask.id)}
                        disabled={!allChecked(liveTask)}
                        className="h-11 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-40"
                      >
                        {allChecked(liveTask) ? "Submit report" : "Complete checklist to submit"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Surface>
  );
}
