import { notFound } from "next/navigation";
import { PresentScreen } from "@/components/PresentScreen";
import { getSessionByCode } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PresentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSessionByCode(code);
  if (!session) notFound();

  return <PresentScreen code={session.code} title={session.title} />;
}
