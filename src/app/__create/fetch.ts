// src/__create/fetch.ts
export default function fetch(input: RequestInfo, init?: RequestInit) {
  return window.fetch(input, init);
}
