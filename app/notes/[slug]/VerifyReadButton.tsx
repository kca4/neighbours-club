'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { verifyNote } from '@/app/actions/verify-note';

// ─── Types ────────────────────────────────────────────────────────────────────

type UIPhase =
  | { name: 'idle' }
  | { name: 'earned'; newBalance: number }
  | { name: 'already_claimed' }
  | { name: 'error'; message: string; isAuthError: boolean };

// ─── Props ────────────────────────────────────────────────────────────────────

interface VerifyReadButtonProps {
  noteId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VerifyReadButton({ noteId }: VerifyReadButtonProps) {
  // useTransition drives the loading state for the server-action call.
  // isPending is true while the action is in flight; startTransition wraps
  // the call so React can keep the page interactive for other interactions.
  const [isPending, startTransition] = useTransition();

  const [phase, setPhase] = useState<UIPhase>({ name: 'idle' });

  function handleClick() {
    // Prevent double-submit: useTransition + state guard together.
    if (isPending || phase.name === 'earned' || phase.name === 'already_claimed') return;

    startTransition(async () => {
      // noteId is the ONLY thing passed to the action.
      // userId is derived server-side from the session — never sent here.
      const result = await verifyNote(noteId);

      if (result.success) {
        if (result.alreadyClaimed) {
          setPhase({ name: 'already_claimed' });
        } else {
          setPhase({ name: 'earned', newBalance: result.newBalance });
        }
      } else {
        setPhase({
          name: 'error',
          message: result.error,
          isAuthError: result.error === 'Not signed in',
        });
      }
    });
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase.name === 'idle') {
    return (
      <div className="mt-8">
        {/* aria-live region announces outcome to screen readers after the
            button is replaced by a settled state */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" />

        <button
          onClick={handleClick}
          disabled={isPending}
          aria-label="Verify you read this note and earn Community Points"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:cursor-wait disabled:opacity-70 sm:w-auto"
          style={{ backgroundColor: '#0F766E' }}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Claiming…
            </>
          ) : (
            <>
              <Star className="h-4 w-4" aria-hidden="true" />
              Verify you read this · Earn points
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Earned ────────────────────────────────────────────────────────────────
  if (phase.name === 'earned') {
    return (
      <div className="mt-8" role="status" aria-live="polite" aria-atomic="true">
        <div className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3.5">
          <CheckCircle2
            className="h-5 w-5 shrink-0"
            style={{ color: '#0F766E' }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold" style={{ color: '#0F766E' }}>
            Points earned!
          </span>
          <span className="text-sm" style={{ color: '#0F766E', opacity: 0.75 }}>
            · New balance: {phase.newBalance.toLocaleString()} CP
          </span>
        </div>
      </div>
    );
  }

  // ── Already claimed ───────────────────────────────────────────────────────
  if (phase.name === 'already_claimed') {
    return (
      <div className="mt-8" role="status" aria-live="polite" aria-atomic="true">
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5">
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-gray-400"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-gray-500">
            Already earned for this note
          </span>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  // phase.name === 'error'
  if (phase.isAuthError) {
    return (
      <div className="mt-8" role="alert" aria-live="polite" aria-atomic="true">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-5 py-3.5">
          <span className="text-sm text-amber-800">
            Sign in to earn points for reading.
          </span>
          <Link
            href="/signin"
            className="text-sm font-semibold underline underline-offset-2"
            style={{ color: '#0F766E' }}
          >
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  // Generic retryable error
  return (
    <div className="mt-8" role="alert" aria-live="polite" aria-atomic="true">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-3.5">
        <span className="text-sm text-red-700">{phase.message}</span>
        <button
          onClick={handleClick}
          disabled={isPending}
          className="text-sm font-semibold underline underline-offset-2 disabled:opacity-50"
          style={{ color: '#0F766E' }}
          aria-label="Retry earning points for this note"
        >
          {isPending ? 'Retrying…' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
