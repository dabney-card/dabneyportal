// pages/api/adjust.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "@/lib/session";
import { VENDOR_META } from "@/lib/vendorMap";

const PASSKIT_BASE = process.env.PASSKIT_BASE!;
const PASSKIT_TOKEN = process.env.PASSKIT_TOKEN!;

async function passkitGet(id: string) {
  const r = await fetch(`${PASSKIT_BASE}/members/member/${id}`, {
    headers: {
      Authorization: `Bearer ${PASSKIT_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function passkitPatch(id: string, body: unknown) {
  const r = await fetch(`${PASSKIT_BASE}/members/member/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${PASSKIT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
}

export default withIronSessionApiRoute(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") return res.status(405).end();

    // Get vendor from session (set during /api/login)
    // @ts-ignore
    const vendorId: string | undefined = req.session.vendorId;
    if (!vendorId) return res.status(401).json({ error: "Not logged in" });

    const { memberId, delta } = (req.body || {}) as {
      memberId?: string;
      delta?: number;
    };
    if (!memberId || typeof delta !== "number") {
      return res
        .status(400)
        .json({ error: "memberId and numeric delta required" });
    }

    // Server-only map: which PassKit field this vendor can edit
    const fieldPath = VENDOR_META[vendorId];
    if (!fieldPath) return res.status(403).json({ error: "Unknown vendor" });

    try {
      // 1) Read member
      const member = await passkitGet(memberId);

      // 2) Read current value at fieldPath (e.g., "meta.harrysMarket")
      const keys = fieldPath.split(".");
      let cur: any = member;
      for (const k of keys) cur = cur?.[k];
      const before = Number(cur ?? 0);

      // 3) Compute resulting value
      const after = before + delta;
      if (!Number.isFinite(after) || after < 0) {
        return res.status(400).json({ error: "Invalid resulting value" });
      }

      // 4) Build minimal PATCH body for just that field
      const patch: any = {};
      keys.reduce(
        (o, k, i) => (o[k] = i === keys.length - 1 ? after : (o[k] || {})),
        patch
      );

      // If delta is 0, just return current (used to "read" on page load)
      if (delta !== 0) await passkitPatch(memberId, patch);

      // Optional: write to your audit log here

      return res.json({ ok: true, before, after });
    } catch (e: any) {
      return res.status(502).json({ error: "PassKit error", detail: e.message });
    }
  },
  sessionOptions
);
