import { IronSessionOptions } from "iron-session";
export type SessionData = { vendorId?: string };

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "dabney_vendor_sess",
  cookieOptions: { secure: true, sameSite: "lax" }
};
