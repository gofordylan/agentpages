import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.githubId = String(profile.id);
        token.githubUsername = profile.login as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).githubId =
          token.githubId as string;
        (session.user as unknown as Record<string, unknown>).githubUsername =
          token.githubUsername as string;
      }
      return session;
    },
  },
});
