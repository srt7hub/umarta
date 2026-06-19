import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEventByToken } from "@/lib/event";
import { MenuSelector } from "./MenuSelector";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const event = await getEventByToken(token);
  if (!event) notFound();

  const dishes = await prisma.dish.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      pricePerGuest: true,
      imageUrl: true,
    },
  });

  return (
    <MenuSelector
      token={token}
      event={{
        title: event.title,
        clientName: event.clientName,
        eventDate: event.eventDate.toISOString(),
        guests: event.guests,
        status: event.status,
        selectedDishIds: event.selectedDishIds,
      }}
      dishes={dishes}
    />
  );
}
