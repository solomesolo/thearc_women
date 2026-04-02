import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { CollectionDetailView } from "@/components/knowledge/CollectionDetailView";
import { getCollection } from "@/lib/knowledge/queries";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/knowledge/collections/${id}`)}`);
  }

  const collection = await getCollection(email, Number(id));
  if (!collection) notFound();

  return (
    <Container className="py-10 md:py-14">
      <CollectionDetailView collection={collection} />
    </Container>
  );
}
