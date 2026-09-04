import { AdminKeyPrompt } from "@/components/AdminKeyPrompt";
import { SessionsAdmin } from "@/components/SessionsAdmin";
import { adminKeyMatches } from "@/lib/adminKey";
import { listSessions } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const { k } = await searchParams;
  const key = Array.isArray(k) ? k[0] : k;
  if (!adminKeyMatches(key)) {
    return <AdminKeyPrompt path="/admin/sessions" wrong={Boolean(key)} />;
  }

  const sessions = await listSessions();
  return (
    <SessionsAdmin
      adminKey={key as string}
      initial={sessions.map((s) => ({
        code: s.code,
        secret: s.secret,
        title: s.title,
        createdAt: s.createdAt,
        closedAt: s.closedAt,
        responseCount: s.responseCount,
      }))}
    />
  );
}
