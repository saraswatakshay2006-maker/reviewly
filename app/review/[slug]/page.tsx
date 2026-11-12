import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReviewAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { slug } = await params;
  const { src } = await searchParams;
  const query = src ? `?src=${encodeURIComponent(src)}` : "";
  redirect(`/r/${encodeURIComponent(slug)}${query}`);
}

