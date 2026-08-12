import { notFound } from "next/navigation";
import { GroupSchedulingPage } from "@/components/group-scheduling-page";
import { availabilitySlots, candidateInputs, hackathonGroup } from "@/lib/group-data";
import { rankCandidateSlots } from "@/lib/scoring";

type GroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;

  if (groupId !== hackathonGroup.id) {
    notFound();
  }

  const candidates = rankCandidateSlots(hackathonGroup, availabilitySlots, candidateInputs);

  return (
    <GroupSchedulingPage
      group={hackathonGroup}
      slots={availabilitySlots}
      candidates={candidates}
    />
  );
}
