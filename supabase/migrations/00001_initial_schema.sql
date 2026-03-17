-- Eli's Artisan Bakery — Initial Schema
-- All tables, indexes, RLS policies, and RPC functions

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. Week
-- ============================================================
create table public.week (
  id              uuid primary key default uuid_generate_v4(),
  label           text not null,
  opens_at        timestamptz,
  closes_at       timestamptz,
  status          text not null default 'draft'
                    check (status in ('draft', 'open', 'closed', 'dispatched')),
  collection_days text[] not null default '{}',
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 2. Product
-- ============================================================
create table public.product (
  id              uuid primary key default uuid_generate_v4(),
  week_id         uuid not null references public.week(id) on delete cascade,
  name            text not null,
  description     text,
  price           decimal(10,2) not null,
  unit_label      text not null default 'per item',
  max_qty         int,
  display_order   int not null default 0,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 3. Customer
-- ============================================================
create table public.customer (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  whatsapp_number   text not null unique,
  is_on_account     boolean not null default false,
  account_balance   decimal(10,2) not null default 0,
  notes             text,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- 4. Order
-- ============================================================
create table public."order" (
  id              uuid primary key default uuid_generate_v4(),
  week_id         uuid not null references public.week(id),
  customer_id     uuid not null references public.customer(id),
  collection_day  text not null
                    check (collection_day in ('friday', 'saturday')),
  payment_status  text not null default 'pending'
                    check (payment_status in ('pending', 'paid', 'on_account')),
  notes           text,
  created_at      timestamptz not null default now()
);

-- Prevent duplicate orders: same customer + same week
create unique index idx_order_unique_customer_week
  on public."order" (week_id, customer_id);

-- ============================================================
-- 5. OrderItem
-- ============================================================
create table public.order_item (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references public."order"(id) on delete cascade,
  product_id      uuid not null references public.product(id),
  quantity        int not null check (quantity > 0),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 6. Collection
-- ============================================================
create table public.collection (
  id                    uuid primary key default uuid_generate_v4(),
  week_id               uuid not null references public.week(id) on delete cascade,
  collection_day        text not null
                          check (collection_day in ('friday', 'saturday')),
  collection_date       date,
  collection_time       text,
  location              text,
  payment_instructions  text,
  created_at            timestamptz not null default now()
);

create unique index idx_collection_week_day
  on public.collection (week_id, collection_day);

-- ============================================================
-- 7. AccountTransaction
-- ============================================================
create table public.account_transaction (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customer(id),
  date            date not null default current_date,
  type            text not null
                    check (type in ('credit', 'debit')),
  amount          decimal(10,2) not null check (amount >= 0),
  description     text,
  order_id        uuid references public."order"(id),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_product_week on public.product(week_id);
create index idx_order_week on public."order"(week_id);
create index idx_order_customer on public."order"(customer_id);
create index idx_order_item_order on public.order_item(order_id);
create index idx_collection_week on public.collection(week_id);
create index idx_account_tx_customer on public.account_transaction(customer_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.week enable row level security;
alter table public.product enable row level security;
alter table public.customer enable row level security;
alter table public."order" enable row level security;
alter table public.order_item enable row level security;
alter table public.collection enable row level security;
alter table public.account_transaction enable row level security;

-- Week: anon can read open weeks, authenticated full access
create policy "Public can view open weeks"
  on public.week for select
  using (status = 'open');

create policy "Admin full access weeks"
  on public.week for all
  using (auth.role() = 'authenticated');

-- Product: anon can read products of open weeks
create policy "Public can view products of open weeks"
  on public.product for select
  using (
    exists (select 1 from public.week where id = week_id and status = 'open')
  );

create policy "Admin full access products"
  on public.product for all
  using (auth.role() = 'authenticated');

-- Customer: anon can insert (created on order), authenticated full access
create policy "Public can create customers"
  on public.customer for insert
  with check (true);

create policy "Admin full access customers"
  on public.customer for all
  using (auth.role() = 'authenticated');

-- Order: anon can insert, authenticated full access
create policy "Public can create orders"
  on public."order" for insert
  with check (true);

create policy "Public can view own order by id"
  on public."order" for select
  using (true);

create policy "Admin full access orders"
  on public."order" for all
  using (auth.role() = 'authenticated');

-- OrderItem: anon can insert, authenticated full access
create policy "Public can create order items"
  on public.order_item for insert
  with check (true);

create policy "Public can view order items"
  on public.order_item for select
  using (true);

create policy "Admin full access order_items"
  on public.order_item for all
  using (auth.role() = 'authenticated');

-- Collection: anon can read collections of open weeks
create policy "Public can view collections of open weeks"
  on public.collection for select
  using (
    exists (select 1 from public.week where id = week_id and status = 'open')
  );

create policy "Admin full access collections"
  on public.collection for all
  using (auth.role() = 'authenticated');

-- AccountTransaction: authenticated only
create policy "Admin full access account_transactions"
  on public.account_transaction for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- RPC: Atomic order creation
-- ============================================================
create or replace function public.create_order_with_items(
  p_week_id uuid,
  p_customer_name text,
  p_whatsapp_number text,
  p_collection_day text,
  p_notes text,
  p_items jsonb  -- [{product_id, quantity}]
) returns uuid as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_total decimal(10,2) := 0;
  v_item jsonb;
  v_product_price decimal(10,2);
  v_is_on_account boolean;
begin
  -- Check week is open
  if not exists (select 1 from public.week where id = p_week_id and status = 'open') then
    raise exception 'Orders for this week are closed';
  end if;

  -- Upsert customer by WhatsApp number
  insert into public.customer (name, whatsapp_number)
  values (p_customer_name, p_whatsapp_number)
  on conflict (whatsapp_number)
    do update set name = excluded.name
  returning id, is_on_account into v_customer_id, v_is_on_account;

  -- Check for duplicate order
  if exists (select 1 from public."order" where week_id = p_week_id and customer_id = v_customer_id) then
    raise exception 'You have already placed an order for this week';
  end if;

  -- Determine payment status
  declare
    v_payment_status text := 'pending';
  begin
    if v_is_on_account then
      v_payment_status := 'on_account';
    end if;

    -- Insert order
    insert into public."order" (week_id, customer_id, collection_day, payment_status, notes)
    values (p_week_id, v_customer_id, p_collection_day, v_payment_status, p_notes)
    returning id into v_order_id;
  end;

  -- Insert order items and calculate total
  for v_item in select * from jsonb_array_elements(p_items) loop
    select price into v_product_price
    from public.product
    where id = (v_item->>'product_id')::uuid and week_id = p_week_id;

    if v_product_price is null then
      raise exception 'Product not found';
    end if;

    insert into public.order_item (order_id, product_id, quantity)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int
    );

    v_order_total := v_order_total + v_product_price * (v_item->>'quantity')::int;
  end loop;

  -- If on-account, create debit transaction and update balance
  if v_is_on_account then
    insert into public.account_transaction (customer_id, type, amount, description, order_id)
    values (v_customer_id, 'debit', v_order_total, 'Order for week', v_order_id);

    update public.customer
    set account_balance = account_balance - v_order_total
    where id = v_customer_id;
  end if;

  return v_order_id;
end;
$$ language plpgsql security definer;
