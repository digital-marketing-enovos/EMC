import { AdminEditor } from "@/components/AdminEditor";
import { AdminKeyPrompt } from "@/components/AdminKeyPrompt";
import { adminKeyMatches } from "@/lib/adminKey";
import { getOverrides, getTexts } from "@/lib/content";

export const dynamic = "force-dynamic";

/**
 * Gated by ADMIN_KEY in the URL. Reached from a link on the session screen that
 * cannot carry the key, so a missing or wrong key asks for it instead of 404.
 * The API routes behind it still answer 404, so nothing is readable without it.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const { k } = await searchParams;
  const key = Array.isArray(k) ? k[0] : k;
  if (!adminKeyMatches(key)) {
    return <AdminKeyPrompt path="/admin" wrong={Boolean(key)} />;
  }

  const [texts, overrides] = await Promise.all([getTexts(), getOverrides()]);

  return (
    <AdminEditor
      adminKey={key as string}
      initialTexts={texts}
      initialOverridden={Object.keys(overrides).map(Number)}
    />
  );
}
