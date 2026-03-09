import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    username: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      username: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    username: string;
    id: string;
  }
}
