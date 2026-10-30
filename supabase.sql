-- Supabase SQL Editor에서 전체를 한 번에 실행하세요.

-- 1. 상품
create table if not exists jeju_products (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null default '',
  emoji text not null default '🍊',
  price integer not null check (price > 0)
);

-- 2. 주문 (반환 = status 를 'returned' 로 변경)
create table if not exists orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  product_id bigint not null references jeju_products(id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null default 0,
  total_price integer not null default 0,
  status text not null default 'ordered' check (status in ('ordered', 'returned')),
  created_at timestamptz not null default now()
);

-- 3. 방명록
create table if not exists guestbook (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 4. 방명록 댓글
create table if not exists guestbook_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references guestbook(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 5. 방명록 좋아요 (한 사람이 한 글에 한 번)
create table if not exists guestbook_likes (
  post_id bigint not null references guestbook(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  primary key (post_id, user_id)
);

-- 주문 금액 계산: 단가는 jeju_products.price 에서 가져오고 total_price = 단가 * 수량
create or replace function set_order_total() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select price into new.unit_price from jeju_products where id = new.product_id;
  new.total_price := new.unit_price * new.quantity;
  return new;
end;
$$;

drop trigger if exists orders_total on orders;
create trigger orders_total
  before insert or update on orders
  for each row execute function set_order_total();

-- RLS
alter table jeju_products enable row level security;
alter table orders enable row level security;
alter table guestbook enable row level security;
alter table guestbook_comments enable row level security;
alter table guestbook_likes enable row level security;

create policy "jeju_products read" on jeju_products for select using (true);

create policy "orders read own" on orders for select using (auth.uid() = user_id);
create policy "orders insert own" on orders for insert with check (auth.uid() = user_id);
create policy "orders update own" on orders for update
  using (auth.uid() = user_id and status = 'ordered')
  with check (auth.uid() = user_id);

create policy "guestbook read" on guestbook for select using (true);
create policy "guestbook insert own" on guestbook for insert with check (auth.uid() = user_id);
create policy "guestbook delete own" on guestbook for delete using (auth.uid() = user_id);

create policy "comments read" on guestbook_comments for select using (true);
create policy "comments insert own" on guestbook_comments for insert with check (auth.uid() = user_id);
create policy "comments delete own" on guestbook_comments for delete using (auth.uid() = user_id);

create policy "likes read" on guestbook_likes for select using (true);
create policy "likes insert own" on guestbook_likes for insert with check (auth.uid() = user_id);
create policy "likes delete own" on guestbook_likes for delete using (auth.uid() = user_id);

-- 상품 데이터
insert into jeju_products (name, description, emoji, price) values
  ('한라봉 3kg', '새콤달콤 과즙 가득한 제주 대표 감귤', '🍊', 28000),
  ('노지 감귤 5kg', '겨울 제철 노지 감귤', '🍊', 15000),
  ('천혜향 3kg', '향이 진한 프리미엄 만감류', '🍑', 35000),
  ('흑돼지 오겹살 600g', '쫄깃하고 고소한 제주 흑돼지', '🐖', 32000),
  ('옥돔 2마리', '담백한 제주 옥돔 구이용', '🐟', 38000),
  ('은갈치 2마리', '은빛 싱싱한 제주 갈치', '🐠', 45000),
  ('오메기떡 10개입', '쫀득한 제주 전통 떡', '🍡', 12000),
  ('우도 땅콩 막걸리', '고소한 우도 땅콩 막걸리', '🥜', 7500),
  ('제주 녹차 티백 20입', '오설록 감성의 향긋한 녹차', '🍵', 9500),
  ('감귤 초콜릿 선물세트', '제주 여행 필수 기념품', '🍫', 8500);
