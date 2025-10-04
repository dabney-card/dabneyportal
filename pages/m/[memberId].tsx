// pages/m/[memberId].tsx
import { GetServerSideProps } from "next";
import { withIronSessionSsr } from "iron-session/next";
import { sessionOptions } from "@/lib/session";
import { useEffect, useState } from "react";

type Props = { memberId: string; vendorId: string };

export const getServerSideProps: GetServerSideProps = withIronSessionSsr(
  async ({ req, params }) => {
    const memberId = String(params!.memberId);
    // @ts-ignore
    const vendorId: string | undefined = req.session.vendorId;
    if (!vendorId) {
      return {
        redirect: { destination: `/login?next=/m/${memberId}`, permanent: false },
      };
    }
    return { props: { memberId, vendorId } };
  },
  sessionOptions
);

export default function MemberPage({ memberId, vendorId }: Props) {
  const [value, setValue] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current vendor-specific points (delta: 0 == read)
  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const r = await fetch("/api/adjust", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ memberId, delta: 0 }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed to load");
        setValue(j.after);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [memberId]);

  async function adjust(delta: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/adjust", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId, delta }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Adjust failed");
      setValue(j.after);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 440, margin: "36px auto" }}>
      <h1 style={{ marginBottom: 8 }}>Dabney Points</h1>
      <div style={{ color: "#555", marginBottom: 16 }}>
        Vendor: <b>{vendorId}</b>
      </div>
      <div style={{ marginBottom: 8 }}>
        Member: <code>{memberId}</code>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          marginTop: 12,
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 12 }}>
          Current: <b>{value ?? "—"}</b>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => adjust(-10)}
            disabled={busy}
            style={{ padding: "10px 14px", borderRadius: 10 }}
          >
            −10
          </button>
          <button
            onClick={() => adjust(10)}
            disabled={busy}
            style={{ padding: "10px 14px", borderRadius: 10 }}
          >
            +10
          </button>
          <button
            onClick={() => adjust(0)}
            disabled={busy}
            style={{ padding: "10px 14px", borderRadius: 10 }}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ color: "#b00020", marginTop: 12 }}>Error: {error}</div>
        )}
      </div>
    </div>
  );
}
