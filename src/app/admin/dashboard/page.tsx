import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin-session";
import { adminListRooms, adminListBooks } from "@/lib/data/admin";
import { logoutAdminAction } from "./actions";
import { RoomsTab } from "./rooms-tab";
import { BooksTab } from "./books-tab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [rooms, books] = await Promise.all([adminListRooms(), adminListBooks()]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">관리자 대시보드</h1>
        <form action={logoutAdminAction}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>

      <Tabs defaultValue="rooms" className="mt-6">
        <TabsList>
          <TabsTrigger value="rooms">방 ({rooms.length})</TabsTrigger>
          <TabsTrigger value="books">책 ({books.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms" className="mt-4">
          <RoomsTab initialRooms={rooms} />
        </TabsContent>
        <TabsContent value="books" className="mt-4">
          <BooksTab initialBooks={books} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
