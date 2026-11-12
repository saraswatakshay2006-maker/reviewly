import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ReviewAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  noStore();
  const { slug } = await params;
  const { src } = await searchParams;
  const query = src ? `?src=${encodeURIComponent(src)}` : "";
  redirect(`/r/${encodeURIComponent(slug)}${query}`);
}
