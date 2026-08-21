import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessId: string;
      role: "owner" | "collector";
    } & DefaultSession["user"];
  }

  interface User {
    businessId: string;
    role: "owner" | "collector";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    businessId: string;
    role: "owner" | "collector";
  }
}
