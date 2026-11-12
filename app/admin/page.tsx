import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser, sessionCookieName } from "@/lib/auth";
import { countSuperAdmins, getSaasSnapshot } from "@/lib/repo";
import AdminBootstrapForm from "@/components/AdminBootstrapForm";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function SuperAdminPage() {
  noStore();
  const user = await getCurrentUser();

  if (!user) {
    const existingSuperAdmins = await countSuperAdmins();
    if (existingSuperAdmins === 0) {
      return <AdminBootstrapForm />;
    }
    redirect("/login");
  }

  if (user.role !== "super_admin") {
    redirect("/app");
  }

  const snapshot = await getSaasSnapshot();

  async function signOutAction() {
    "use server";
    const { cookies } = await import("next/headers");
    (await cookies()).delete(sessionCookieName());
    redirect("/login");
  }

  return (
    <AdminDashboardClient
      initialData={snapshot}
      currentAdminId={user.id}
      adminName={user.name}
      adminEmail={user.email}
      signOutAction={signOutAction}
    />
  );
}
