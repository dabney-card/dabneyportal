import type { NextApiRequest, NextApiResponse } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "../../lib/session";

const USERS = [
  { email: "clerk@harrys.com", password: "temp123", vendorId: "harry" },
  { email: "clerk@lambeth.com", password: "temp123", vendorId: "lambeth" },
];

export default withIronSessionApiRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") return res.status(405).end();
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // @ts-ignore
  req.session.vendorId = user.vendorId;
  // @ts-ignore
  await req.session.save();
  res.json({ ok: true });
}, sessionOptions);
