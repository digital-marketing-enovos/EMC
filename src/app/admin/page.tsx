import { notFound } from "next/navigation";
import { AdminEditor } from "@/components/AdminEditor";
import { adminKeyMatches } from "@/lib/adminKey";
import { getOverrides, getTexts } from "@/lib/content";

export const dynamic = "force-dynamic";

/**
 * Gated by ADMIN_KEY in the URL, like the results screen. A wrong or missing
 * key is a plain 404 — the page never admits it exists.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const { k } = await searchParams;
  const key = Array.isArray(k) ? k[0] : k;
  if (!adminKeyMatches(key)) notFound();

  const [texts, overrides] = await Promise.all([getTexts(), getOverrides()]);

  return (
    <AdminEditor
      adminKey={key as string}
      initialTexts={texts}
      initialOverridden={Object.keys(overrides).map(Number)}
    />
  );
}
