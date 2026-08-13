import { notFound } from "next/navigation";
import { Questionnaire } from "@/components/Questionnaire";
import { Shell } from "@/components/Shell";
import { resolveItems } from "@/lib/content";
import { DISPLAY_ORDER } from "@/lib/items";
import { getSessionByCode } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSessionByCode(code);
  if (!session) notFound();

  // Wording comes from the admin screen; the order and the scoring fields do not.
  const items = await resolveItems();
  const ordered = DISPLAY_ORDER.map((id) => items.find((i) => i.id === id)!);

  return (
    <Shell subtitle="12 trade-offs · where we start, where we must go">
      <Questionnaire code={session.code} closed={Boolean(session.closedAt)} items={ordered} />
    </Shell>
  );
}
