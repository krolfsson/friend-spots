"use client";

const LS = "friend_spots_voter";

/** Anonymous device token (same browser). Created on first visit. */
export function getOrCreateVoterToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let v = window.localStorage.getItem(LS);
    if (!v) {
      v = crypto.randomUUID();
      window.localStorage.setItem(LS, v);
    }
    return v;
  } catch {
    return "";
  }
}
