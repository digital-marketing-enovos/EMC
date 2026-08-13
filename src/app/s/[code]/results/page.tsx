import { notFound } from "next/navigation";
import { ResultsBoard } from "@/components/ResultsBoard";
import { getSessionByCode, secretMatches } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Gated by the facilitator secret in the URL. A wrong or missing `k` is a plain
 * 404 — never a redirect, so the page leaks nothing about whether the code exists.
 */
export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const { code } = await params;
  const { k } = await searchParams;
  const secret = Array.isArray(k) ? k[0] : k;

  const session = await getSessionByCode(code);
  if (!session || !secretMatches(session.secret, secret)) notFound();

  return <ResultsBoard code={session.code} secret={session.secret} title={session.title} />;
}
