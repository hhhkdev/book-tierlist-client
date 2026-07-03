import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin-session";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 p-6">
      <h1 className="text-xl font-semibold">관리자 대시보드</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        방/책 관리 기능이 곧 이곳에 추가됩니다.
      </p>
    </div>
  );
}
