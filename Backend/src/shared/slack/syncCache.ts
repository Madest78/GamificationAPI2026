const COOLDOWN_MS = 5 * 60 * 1000; // 5 минут

interface SyncAttempt {
    lastFailedAt: number;
    attempts: number;
}

const failedSyncCache = new Map<string, SyncAttempt>();

export function shouldAttemptSync(email: string): boolean {
    const attempt = failedSyncCache.get(email);
    if (!attempt) return true;

    const timeSinceLastFail = Date.now() - attempt.lastFailedAt;
    if (timeSinceLastFail > COOLDOWN_MS) {
        failedSyncCache.delete(email);
        return true;
    }

    return false;
}

export function recordSyncFailure(email: string): void {
    const existing = failedSyncCache.get(email);
    failedSyncCache.set(email, {
        lastFailedAt: Date.now(),
        attempts: (existing?.attempts || 0) + 1,
    });
}

export function recordSyncSuccess(email: string): void {
    failedSyncCache.delete(email);
}

export function getSyncStatus(email: string): { cooldown: boolean; attempts: number; retryAfterMs: number } {
    const attempt = failedSyncCache.get(email);
    if (!attempt) return { cooldown: false, attempts: 0, retryAfterMs: 0 };

    const retryAfterMs = Math.max(0, COOLDOWN_MS - (Date.now() - attempt.lastFailedAt));
    return {
        cooldown: retryAfterMs > 0,
        attempts: attempt.attempts,
        retryAfterMs,
    };
}
