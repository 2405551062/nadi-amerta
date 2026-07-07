/**
 * In-process event bus for ops real-time (design/02, design/10 §11).
 * Single-instance dev broadcast; a multi-instance deployment would swap this
 * for Redis pub/sub. Survives HMR via globalThis.
 */
import "server-only";
import { EventEmitter } from "node:events";

const g = globalThis as unknown as { __opsBus?: EventEmitter };
export const opsBus: EventEmitter = g.__opsBus ?? (g.__opsBus = new EventEmitter());
opsBus.setMaxListeners(0);

export type OpsTopic =
  | "villa-status" | "reservation" | "hk-task" | "fnb" | "request" | "inventory";

/** Broadcast an ops change so connected consoles refresh. */
export function publishOps(topic: OpsTopic) {
  opsBus.emit("ops", { topic, at: Date.now() });
}
