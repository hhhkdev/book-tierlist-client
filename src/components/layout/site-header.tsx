import Link from "next/link";
import { getUserSession } from "@/lib/auth/session";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await getUserSession();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          책 티어리스트
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session ? (
            <>
              <Link href="/rooms/new" className="text-muted-foreground hover:text-foreground">
                방 만들기
              </Link>
              <span className="text-muted-foreground">{session.name}님</span>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  로그아웃
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                로그인
              </Link>
              <Link href="/signup">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
