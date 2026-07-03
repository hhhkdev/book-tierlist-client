# Supabase 설정 가이드

이 프로젝트는 Supabase Auth를 쓰지 않는다. 로그인 방식이 스펙상 커스텀(이름+비밀번호, 게스트는 이름+직책만)이라 Supabase는 순수 Postgres 데이터베이스로만 사용하고, 모든 DB 접근은 Next.js 서버 코드(Server Actions / Data Access Layer)에서 **서비스 롤 키**로만 수행한다.

## 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 새 프로젝트 생성 (리전은 사용자와 가까운 곳, 예: Seoul 근처 가능한 리전).
2. 프로젝트 생성 후 **Project Settings → API**에서 아래 두 값을 확인:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 시크릿 키 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 이 키는 RLS를 완전히 우회하므로 절대 클라이언트 번들에 포함되면 안 됨. `NEXT_PUBLIC_` 접두사 금지)

## 2. 스키마 적용

Supabase 대시보드 → **SQL Editor**에서 `docs/supabase/schema.sql` 파일 전체 내용을 붙여넣고 실행한다. 이 한 번의 실행으로 다음이 모두 생성된다:

- 테이블 8개: `users`, `books`, `rooms`, `room_books`, `guests`, `tier_lists`, `tier_list_entries`, `comments`
- `tier_value` enum (`S`,`A`,`B`,`C`,`D`,`F`,`ETC`)
- 인덱스 일체
- **배포 잠금 트리거** (`trg_room_books_lock_after_deploy`): 방이 `is_deployed=true`가 되면 `room_books`의 insert/delete와 `book_id` 변경이 차단됨. `synopsis`/`rating`/`display_order` 수정은 계속 허용.
- **50명 캡 RPC** (`join_room_as_guest`): 게스트 로그인 시 이 함수를 호출하면 동일 (room, name, position) 조합은 기존 행을 반환하고, 신규 참여자는 방당 50명 제한을 원자적으로 강제함.
- **집계 뷰** (`room_book_consensus`): 책별/티어별 득표수 (ETC 제외). 앱은 이 뷰에서 `DISTINCT ON (room_book_id) ... order by vote_count desc`로 최다 득표 티어를 뽑는다.

## 3. RLS (Row Level Security) 방침

모든 테이블에 RLS를 켜두었지만 **정책은 하나도 없다 (deny-all)**. 이유: 앱은 항상 서버에서 서비스 롤 키로 접근하고, 서비스 롤은 RLS를 우회하기 때문에 정책 자체가 앱 동작에 필요 없다. 그럼에도 RLS를 켜두는 이유는, 만약 실수로 anon key가 클라이언트 코드에 노출되더라도 anon 롤로는 어떤 테이블도 읽거나 쓸 수 없도록 하는 심층 방어(defense-in-depth)를 위함이다.

## 4. 환경 변수

`.env.local` (Next.js 프로젝트 루트, 절대 커밋하지 말 것 — `.gitignore`에 이미 포함됨)에 아래 값을 설정한다:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role secret>
SESSION_SECRET=<32바이트 이상의 무작위 문자열, 예: openssl rand -base64 32>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<관리자 비밀번호>
```

- `SESSION_SECRET`: 유저/게스트/관리자 세션 쿠키(JWT)를 서명하는 데 사용. 노출되면 누구나 임의의 세션을 위조할 수 있으므로 반드시 무작위 생성값 사용.
- `ADMIN_USERNAME`/`ADMIN_PASSWORD`: 관리자 로그인 자격증명. 코드에 하드코딩하지 않고 항상 이 env var로만 확인.

## 5. 이미지(표지) 처리

책 표지/방 커버는 URL 입력만 지원한다 (파일 업로드 없음, Supabase Storage 미사용). 사용자가 임의의 호스트 URL을 입력할 수 있으므로 `next/image`의 `remotePatterns` 화이트리스트 방식 대신 일반 `<img>` 태그(또는 `next/image`의 `unoptimized` 옵션)를 사용한다.

## 6. 로컬 개발 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] `docs/supabase/schema.sql` 실행
- [ ] `.env.local`에 위 4개 값 설정
- [ ] `npm run dev`로 로컬 확인
