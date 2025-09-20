// src/app/__create/useDevServerHeartbeat.ts
// Production no-op for dev heartbeat (prevents unresolved import during build)

export function useDevServerHeartbeat(): void {
  // This is only used in dev. In prod, it does nothing.
}
