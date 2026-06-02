/**
 * lib/shipping/uberAdapter.ts
 *
 * ─── Shipping Adapter — Uber Direct (STUB) ────────────────────────────────────
 *
 * This file exports a singleton `shippingAdapter` that the rest of the app
 * imports for all courier dispatch operations. Currently it runs a local stub
 * that simulates Uber Direct behaviour without any real API credentials.
 *
 * ── HOW TO SWAP IN THE REAL UBER DIRECT ADAPTER ──────────────────────────────
 *
 * 1. Create `lib/shipping/uberDirectAdapter.ts` that implements `ShippingAdapter`
 *    using real Uber Direct HTTP calls:
 *      POST /v1/customers/{customer_id}/deliveries  → createJob
 *      POST /v1/customers/{customer_id}/deliveries/{delivery_id}/cancel → cancelJob
 *      GET  /v1/customers/{customer_id}/deliveries/{delivery_id}        → getJobStatus
 *
 * 2. Uber Direct sends status updates via webhook (POST to your endpoint).
 *    Register a route at e.g. /api/webhooks/uber and handle the
 *    `status.changed` event to advance DeliveryOrder status in the DB.
 *    The cron-based polling used by the stub is NOT needed for the real adapter.
 *
 * 3. Replace the last line of this file:
 *      export const shippingAdapter: ShippingAdapter = new UberDirectAdapter();
 *    Nothing else in the codebase needs to change — all call sites import
 *    `shippingAdapter` from this module.
 *
 * 4. Set the required env vars:
 *      UBER_CLIENT_ID, UBER_CLIENT_SECRET, UBER_CUSTOMER_ID
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Public interface ─────────────────────────────────────────────────────────
//
// Mirrors the surface area of the real Uber Direct delivery API so that
// call-sites are written once and work against both the stub and the real
// implementation.

export interface CreateJobParams {
  orderId: string;
  pickupAddress: string;
  pickupName: string;
  dropoffAddress: string;
  dropoffName: string;
  items: { name: string; quantity: number }[];
}

export interface CreateJobResult {
  jobId: string;
  status: string;
  pickupPin: string;
}

export interface JobResult {
  jobId: string;
  status: string;
}

export interface ShippingAdapter {
  /**
   * Request a courier pickup. Returns a jobId that should be persisted on the
   * DeliveryOrder (e.g. in a `courierJobId` column) so it can be passed to
   * cancelJob / getJobStatus later.
   *
   * Also returns a pickupPin that must be stored on the order and shown to
   * the kitchen / driver UIs.
   */
  createJob(params: CreateJobParams): Promise<CreateJobResult>;

  /** Cancel an in-flight courier job. */
  cancelJob(jobId: string): Promise<JobResult>;

  /**
   * Poll the current status of a courier job.
   *
   * Stub statuses:  "pending" → "assigned" (after simulated delay) | "cancelled"
   * Real statuses mirror Uber Direct: "pending", "pickup", "pickup_complete",
   *   "dropoff", "delivered", "cancelled", "returned"
   */
  getJobStatus(jobId: string): Promise<JobResult>;
}

// ─── Stub internals ───────────────────────────────────────────────────────────

/** How long the stub waits before simulating courier assignment. */
const SIMULATED_ASSIGN_DELAY_MS = 20_000; // 20 seconds — fast enough for dev testing

type SimulatedStatus = "pending" | "assigned" | "cancelled";

interface SimulatedJob {
  assignAt: Date;        // wall-clock time at which we flip to "assigned"
  status: SimulatedStatus;
}

/**
 * Module-level store for in-flight simulated jobs.
 *
 * Keyed by jobId. Lives for the lifetime of the Next.js dev process.
 * Lost on server restart — acceptable for a stub; the cron simply won't find
 * a record and the order stays AWAITING_COURIER until the next seed run.
 */
const simulatedJobs = new Map<string, SimulatedJob>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomDigits(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function resolveSimulatedStatus(job: SimulatedJob): SimulatedStatus {
  if (job.status === "cancelled") return "cancelled";
  return Date.now() >= job.assignAt.getTime() ? "assigned" : "pending";
}

// ─── UberStubAdapter ──────────────────────────────────────────────────────────

class UberStubAdapter implements ShippingAdapter {
  async createJob(params: CreateJobParams): Promise<CreateJobResult> {
    const jobId = `uber_sim_${Date.now()}_${randomDigits(6)}`;
    const pickupPin = randomDigits(4);

    // Log the full payload so we can inspect what would be sent to the real API
    console.log(
      "[UberStub] createJob",
      JSON.stringify({ jobId, pickupPin, ...params }, null, 2)
    );

    // Register the job in the in-memory store
    simulatedJobs.set(jobId, {
      assignAt: new Date(Date.now() + SIMULATED_ASSIGN_DELAY_MS),
      status: "pending",
    });

    // Simulate ~500 ms of network latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { jobId, status: "pending", pickupPin };
  }

  async cancelJob(jobId: string): Promise<JobResult> {
    console.log("[UberStub] cancelJob", JSON.stringify({ jobId }));

    const job = simulatedJobs.get(jobId);
    if (job) {
      job.status = "cancelled";
    }

    return { jobId, status: "cancelled" };
  }

  async getJobStatus(jobId: string): Promise<JobResult> {
    console.log("[UberStub] getJobStatus", JSON.stringify({ jobId }));

    const job = simulatedJobs.get(jobId);

    if (!job) {
      // Job not in memory (e.g. server restarted). Return "pending" so the
      // cron doesn't accidentally advance or cancel the order.
      return { jobId, status: "pending" };
    }

    const status = resolveSimulatedStatus(job);

    // Materialise the transition so subsequent calls are consistent
    if (status === "assigned" && job.status !== "cancelled") {
      job.status = "assigned";
    }

    return { jobId, status };
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
//
// Swap this line to use the real Uber Direct adapter (see instructions at top).

export const shippingAdapter: ShippingAdapter = new UberStubAdapter();
