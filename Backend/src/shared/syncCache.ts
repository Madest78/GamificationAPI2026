const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 минут

interface SyncAttempt {
    lastFailedAt: number;
    attempts: number;
}

// Ключ: "service:identifier" (например "slack:yury@emplanner.team")
const failedSyncCache = new Map<string, SyncAttempt>();

export function shouldAttemptSync(service: string, identifier: string, cooldownMs = DEFAULT_COOLDOWN_MS): boolean {
    const key = `${service}:${identifier}`;
    const attempt = failedSyncCache.get(key);
    if (!attempt) return true;

    const timeSinceLastFail = Date.now() - attempt.lastFailedAt;
    if (timeSinceLastFail > cooldownMs) {
        failedSyncCache.delete(key);
        return true;
    }

    return false;
}

export function recordSyncFailure(service: string, identifier: string): void {
    const key = `${service}:${identifier}`;
    const existing = failedSyncCache.get(key);
    failedSyncCache.set(key, {
        lastFailedAt: Date.now(),
        attempts: (existing?.attempts || 0) + 1,
    });
}

export function recordSyncSuccess(service: string, identifier: string): void {
    const key = `${service}:${identifier}`;
    failedSyncCache.delete(key);
}

export function getSyncStatus(service: string, identifier: string, cooldownMs = DEFAULT_COOLDOWN_MS) {
    const key = `${service}:${identifier}`;
    const attempt = failedSyncCache.get(key);
    if (!attempt) return { cooldown: false, attempts: 0, retryAfterMs: 0 };

    const retryAfterMs = Math.max(0, cooldownMs - (Date.now() - attempt.lastFailedAt));
    return {
        cooldown: retryAfterMs > 0,
        attempts: attempt.attempts,
        retryAfterMs,
    };
}
