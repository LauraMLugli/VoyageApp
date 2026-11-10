create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  usuario text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_usuario_lower_key
  on public.profiles (lower(usuario));

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_cards (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  number text not null,
  holder text not null,
  type text not null check (type in ('comum', 'estudante', 'vale')),
  linked_at timestamptz not null default now(),
  status text not null default 'ativo' check (status in ('ativo', 'bloqueado'))
);

create table if not exists public.pass_catalog (
  id text primary key,
  kind text not null check (kind in ('unico', 'diario', 'mensal')),
  scope text not null check (scope in ('urbano', 'regional')),
  name text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  duration_hours integer not null check (duration_hours > 0),
  uses integer check (uses is null or uses > 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.user_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pass_id text not null references public.pass_catalog (id),
  purchased_at timestamptz not null default now(),
  expires_at timestamptz not null,
  uses_left integer check (uses_left is null or uses_left >= 0),
  expiry_notified boolean not null default false
);

create index if not exists user_passes_user_expiry_idx
  on public.user_passes (user_id, expires_at desc);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('recarga', 'passe', 'viagem')),
  title text not null,
  subtitle text not null,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('saldo', 'recarga', 'passe', 'transporte')),
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index if not exists notices_user_created_idx
  on public.notices (user_id, created_at desc);

create table if not exists public.favorite_lines (
  user_id uuid not null references public.profiles (id) on delete cascade,
  line_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, line_id)
);

create table if not exists public.transit_stops (
  id text primary key,
  name text not null,
  x numeric not null,
  y numeric not null
);

create table if not exists public.transit_lines (
  id text primary key,
  code text not null,
  name text not null,
  kind text not null check (kind in ('urbana', 'regional')),
  color text not null,
  fare numeric(12, 2) not null check (fare >= 0),
  stop_ids text[] not null
);

create table if not exists public.transit_buses (
  id text primary key,
  line_id text not null references public.transit_lines (id) on delete cascade,
  dist numeric not null default 0,
  dir smallint not null default 1 check (dir in (-1, 1)),
  speed numeric not null default 16 check (speed > 0)
);

create table if not exists public.favorite_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  origin_id text not null references public.transit_stops (id),
  dest_id text not null references public.transit_stops (id),
  created_at timestamptz not null default now(),
  constraint favorite_routes_distinct_stops check (origin_id <> dest_id),
  constraint favorite_routes_user_pair_key unique (user_id, origin_id, dest_id)
);

insert into public.pass_catalog
  (id, kind, scope, name, description, price, duration_hours, uses, sort_order)
values
  ('unico-urbano', 'unico', 'urbano', 'Passe único', 'Uma viagem dentro da cidade.', 5.50, 24, 1, 1),
  ('diario-urbano', 'diario', 'urbano', 'Passe diário', 'Viagens ilimitadas por 24 horas.', 16.00, 24, null, 2),
  ('mensal-urbano', 'mensal', 'urbano', 'Passe mensal', 'Mobilidade urbana por 30 dias.', 145.00, 720, null, 3),
  ('unico-regional', 'unico', 'regional', 'Passe regional único', 'Uma viagem entre cidades da região.', 12.00, 24, 1, 4),
  ('diario-regional', 'diario', 'regional', 'Passe regional diário', 'Urbano e regional ilimitado por 24 horas.', 38.00, 24, null, 5),
  ('mensal-regional', 'mensal', 'regional', 'Passe regional mensal', 'Mobilidade regional por 30 dias.', 320.00, 720, null, 6)
on conflict (id) do nothing;

insert into public.transit_stops (id, name, x, y)
values
  ('term', 'Terminal Central', 180, 230),
  ('centro', 'Praça Central', 180, 140),
  ('vilarosa', 'Vila Rosa', 60, 90),
  ('avprinc', 'Av. Principal', 240, 110),
  ('hosp', 'Hospital Municipal', 300, 80),
  ('fatec', 'Fatec', 300, 200),
  ('rodo', 'Rodoviária', 100, 230),
  ('jdsao', 'Jardim São Sebastião', 70, 350),
  ('norte', 'Jardim Norte', 180, 40),
  ('parque', 'Parque Municipal', 190, 370),
  ('distrito', 'Distrito Industrial', 330, 285),
  ('matao', 'Matão', 335, 420)
on conflict (id) do nothing;

insert into public.transit_lines (id, code, name, kind, color, fare, stop_ids)
values
  ('201', '201', 'Centro · Vila Rosa', 'urbana', '#0951A0', 5.50, array['term', 'centro', 'vilarosa']),
  ('302', '302', 'Terminal · Jardim São Sebastião', 'urbana', '#F2A900', 5.50, array['term', 'rodo', 'jdsao']),
  ('405', '405', 'Centro · Hospital', 'urbana', '#7B2CFF', 5.50, array['centro', 'avprinc', 'hosp']),
  ('118', '118', 'Fatec · Centro', 'urbana', '#00C9A7', 5.50, array['fatec', 'term', 'centro']),
  ('507', '507', 'Jardim Norte · Parque', 'urbana', '#E5484D', 5.50, array['norte', 'centro', 'term', 'parque']),
  ('710', '710', 'Taquaritinga · Matão', 'regional', '#192440', 12.00, array['term', 'fatec', 'distrito', 'matao'])
on conflict (id) do nothing;

create or replace function public.create_mobile_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  profile_name text;
  profile_usuario text;
begin
  profile_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));
  profile_usuario := lower(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'usuario'), ''),
    'user-' || left(replace(new.id::text, '-', ''), 12)
  ));

  insert into public.profiles (id, name, usuario, email)
  values (new.id, profile_name, profile_usuario, lower(new.email))
  on conflict (id) do update
    set email = excluded.email;

  insert into public.wallets (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_voyage on auth.users;
create trigger on_auth_user_created_voyage
  after insert on auth.users
  for each row execute function public.create_mobile_profile();

create or replace function public.sync_mobile_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
      set email = lower(new.email)
      where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated_voyage on auth.users;
create trigger on_auth_user_email_updated_voyage
  after update of email on auth.users
  for each row execute function public.sync_mobile_profile_email();

insert into public.profiles (id, name, usuario, email)
select
  id,
  coalesce(nullif(trim(raw_user_meta_data ->> 'name'), ''), split_part(email, '@', 1)),
  lower(coalesce(nullif(trim(raw_user_meta_data ->> 'usuario'), ''), 'user-' || left(replace(id::text, '-', ''), 12))),
  lower(email)
from auth.users
on conflict (id) do nothing;

insert into public.wallets (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.user_cards enable row level security;
alter table public.pass_catalog enable row level security;
alter table public.user_passes enable row level security;
alter table public.transactions enable row level security;
alter table public.notices enable row level security;
alter table public.favorite_lines enable row level security;
alter table public.favorite_routes enable row level security;
alter table public.transit_stops enable row level security;
alter table public.transit_lines enable row level security;
alter table public.transit_buses enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Users read own wallet" on public.wallets;
create policy "Users read own wallet" on public.wallets
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users read own card" on public.user_cards;
create policy "Users read own card" on public.user_cards
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Anyone reads active pass catalog" on public.pass_catalog;
create policy "Anyone reads active pass catalog" on public.pass_catalog
  for select to anon, authenticated using (active);
drop policy if exists "Users read own passes" on public.user_passes;
create policy "Users read own passes" on public.user_passes
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users read own transactions" on public.transactions;
create policy "Users read own transactions" on public.transactions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users read own notices" on public.notices;
create policy "Users read own notices" on public.notices
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users read own favorite lines" on public.favorite_lines;
create policy "Users read own favorite lines" on public.favorite_lines
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users read own favorite routes" on public.favorite_routes;
create policy "Users read own favorite routes" on public.favorite_routes
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Anyone reads transit stops" on public.transit_stops;
create policy "Anyone reads transit stops" on public.transit_stops
  for select to anon, authenticated using (true);
drop policy if exists "Anyone reads transit lines" on public.transit_lines;
create policy "Anyone reads transit lines" on public.transit_lines
  for select to anon, authenticated using (true);
drop policy if exists "Anyone reads transit buses" on public.transit_buses;
create policy "Anyone reads transit buses" on public.transit_buses
  for select to anon, authenticated using (true);

grant select on public.profiles, public.wallets, public.user_cards, public.user_passes,
  public.transactions, public.notices, public.favorite_lines, public.favorite_routes
  to authenticated;
grant select on public.pass_catalog, public.transit_stops, public.transit_lines, public.transit_buses
  to anon, authenticated;

create or replace function public.get_my_voyage_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_balance numeric(12, 2);
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;

  select balance into current_balance
    from public.wallets where user_id = current_user_id;

  return jsonb_build_object(
    'balance', coalesce(current_balance, 0),
    'card', (
      select jsonb_build_object(
        'number', number,
        'holder', holder,
        'type', type,
        'linkedAt', (extract(epoch from linked_at) * 1000)::bigint,
        'status', status
      )
      from public.user_cards where user_id = current_user_id
    ),
    'passes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', owned.id::text,
        'passId', owned.pass_id,
        'name', catalog.name,
        'kind', catalog.kind,
        'scope', catalog.scope,
        'price', catalog.price,
        'purchasedAt', (extract(epoch from owned.purchased_at) * 1000)::bigint,
        'expiresAt', (extract(epoch from owned.expires_at) * 1000)::bigint,
        'usesLeft', owned.uses_left,
        'expiryNotified', owned.expiry_notified
      ) order by owned.purchased_at desc)
      from public.user_passes owned
      join public.pass_catalog catalog on catalog.id = owned.pass_id
      where owned.user_id = current_user_id
    ), '[]'::jsonb),
    'txs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id::text,
        'type', type,
        'title', title,
        'subtitle', subtitle,
        'amount', amount,
        'ts', (extract(epoch from created_at) * 1000)::bigint
      ) order by created_at desc)
      from (
        select * from public.transactions
        where user_id = current_user_id
        order by created_at desc
        limit 100
      ) recent_transactions
    ), '[]'::jsonb),
    'notices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id::text,
        'kind', kind,
        'title', title,
        'message', message,
        'ts', (extract(epoch from created_at) * 1000)::bigint,
        'read', is_read
      ) order by created_at desc)
      from (
        select * from public.notices
        where user_id = current_user_id
        order by created_at desc
        limit 100
      ) recent_notices
    ), '[]'::jsonb),
    'favLines', coalesce((
      select jsonb_agg(line_id order by created_at)
      from public.favorite_lines where user_id = current_user_id
    ), '[]'::jsonb),
    'favRoutes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id::text,
        'originId', origin_id,
        'destId', dest_id
      ) order by created_at)
      from public.favorite_routes where user_id = current_user_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.update_my_profile(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  updated_profile public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  if p_name is null or length(trim(p_name)) < 3 then
    raise exception 'Informe um nome com pelo menos 3 caracteres' using errcode = '22023';
  end if;

  update public.profiles set name = trim(p_name)
    where id = current_user_id
    returning * into updated_profile;

  return jsonb_build_object(
    'id', updated_profile.id,
    'name', updated_profile.name,
    'usuario', updated_profile.usuario,
    'email', updated_profile.email,
    'avatar_url', updated_profile.avatar_url
  );
end;
$$;

create or replace function public.set_my_card(p_number text, p_holder text, p_type text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  if length(trim(coalesce(p_number, ''))) < 4 or length(trim(coalesce(p_holder, ''))) < 2
    or p_type not in ('comum', 'estudante', 'vale') then
    raise exception 'Dados do cartão inválidos' using errcode = '22023';
  end if;

  insert into public.user_cards (user_id, number, holder, type, status, linked_at)
  values (current_user_id, trim(p_number), trim(p_holder), p_type, 'ativo', now())
  on conflict (user_id) do update set
    number = excluded.number,
    holder = excluded.holder,
    type = excluded.type,
    status = 'ativo',
    linked_at = now();

  return jsonb_build_object('message', 'Cartão atualizado.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.create_virtual_card(p_holder text, p_type text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  generated_number text;
begin
  generated_number := lpad(floor(random() * 10000000000000000)::bigint::text, 16, '0');
  return public.set_my_card(generated_number, p_holder, p_type);
end;
$$;

create or replace function public.remove_my_card()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  delete from public.user_cards where user_id = auth.uid();
  return jsonb_build_object('message', 'Cartão removido.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.recharge_my_wallet(p_amount numeric, p_method text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  if p_amount < 5 or p_amount > 500 or p_method not in ('pix', 'credito', 'debito') then
    raise exception 'Valor ou forma de recarga inválidos' using errcode = '22023';
  end if;

  update public.wallets
    set balance = balance + round(p_amount, 2), updated_at = now()
    where user_id = current_user_id;
  if not found then
    raise exception 'Carteira não encontrada' using errcode = 'P0002';
  end if;

  insert into public.transactions (user_id, type, title, subtitle, amount)
  values (current_user_id, 'recarga', 'Recarga', 'Via ' || upper(p_method), round(p_amount, 2));
  insert into public.notices (user_id, kind, title, message)
  values (current_user_id, 'recarga', 'Recarga realizada', 'Seu saldo foi atualizado.');

  return jsonb_build_object('message', 'Recarga realizada.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.purchase_my_pass(p_pass_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  selected_pass public.pass_catalog%rowtype;
  current_balance numeric(12, 2);
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;

  select * into selected_pass
    from public.pass_catalog where id = p_pass_id and active
    for share;
  if not found then
    raise exception 'Passe não encontrado' using errcode = 'P0002';
  end if;

  select balance into current_balance
    from public.wallets where user_id = current_user_id for update;
  if current_balance is null or current_balance < selected_pass.price then
    raise exception 'Saldo insuficiente para comprar este passe' using errcode = 'P0001';
  end if;

  update public.wallets
    set balance = balance - selected_pass.price, updated_at = now()
    where user_id = current_user_id;

  insert into public.user_passes (user_id, pass_id, expires_at, uses_left)
  values (
    current_user_id,
    selected_pass.id,
    now() + make_interval(hours => selected_pass.duration_hours),
    selected_pass.uses
  );
  insert into public.transactions (user_id, type, title, subtitle, amount)
  values (current_user_id, 'passe', selected_pass.name, selected_pass.scope, -selected_pass.price);
  insert into public.notices (user_id, kind, title, message)
  values (current_user_id, 'passe', 'Passe comprado', selected_pass.name || ' disponível na sua conta.');

  return jsonb_build_object('message', 'Passe comprado.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.board_my_line(p_line_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  selected_line public.transit_lines%rowtype;
  selected_pass_id uuid;
  pass_uses integer;
  current_balance numeric(12, 2);
  fare_paid numeric(12, 2);
  trip_subtitle text;
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;

  select * into selected_line from public.transit_lines where id = p_line_id;
  if not found then
    raise exception 'Linha não encontrada' using errcode = 'P0002';
  end if;

  select owned.id, owned.uses_left into selected_pass_id, pass_uses
    from public.user_passes owned
    join public.pass_catalog catalog on catalog.id = owned.pass_id
    where owned.user_id = current_user_id
      and owned.expires_at > now()
      and (owned.uses_left is null or owned.uses_left > 0)
      and (catalog.scope = 'regional' or selected_line.kind = 'urbana')
    order by owned.expires_at desc
    limit 1
    for update of owned;

  if selected_pass_id is not null then
    if pass_uses is not null then
      update public.user_passes
        set uses_left = uses_left - 1
        where id = selected_pass_id;
    end if;
    fare_paid := 0;
    trip_subtitle := 'Passe utilizado';
  else
    select balance into current_balance
      from public.wallets where user_id = current_user_id for update;
    if current_balance is null or current_balance < selected_line.fare then
      raise exception 'Saldo insuficiente para embarcar' using errcode = 'P0001';
    end if;
    update public.wallets
      set balance = balance - selected_line.fare, updated_at = now()
      where user_id = current_user_id;
    fare_paid := selected_line.fare;
    trip_subtitle := 'Linha ' || selected_line.code;
  end if;

  insert into public.transactions (user_id, type, title, subtitle, amount)
  values (current_user_id, 'viagem', 'Embarque', trip_subtitle, -fare_paid);

  return jsonb_build_object('message', 'Embarque registrado.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.toggle_my_favorite_line(p_line_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  if not exists (select 1 from public.transit_lines where id = p_line_id) then
    raise exception 'Linha não encontrada' using errcode = 'P0002';
  end if;

  delete from public.favorite_lines where user_id = current_user_id and line_id = p_line_id;
  if not found then
    insert into public.favorite_lines (user_id, line_id) values (current_user_id, p_line_id);
  end if;
  return jsonb_build_object('message', 'Favoritos atualizados.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.add_my_favorite_route(p_origin_id text, p_dest_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  if p_origin_id = p_dest_id then
    raise exception 'Origem e destino devem ser diferentes' using errcode = '22023';
  end if;

  insert into public.favorite_routes (user_id, origin_id, dest_id)
  values (current_user_id, p_origin_id, p_dest_id)
  on conflict (user_id, origin_id, dest_id) do nothing;

  return jsonb_build_object('message', 'Rota favorita salva.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.remove_my_favorite_route(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  delete from public.favorite_routes where id = p_id and user_id = auth.uid();
  return jsonb_build_object('message', 'Rota removida dos favoritos.', 'state', public.get_my_voyage_state());
end;
$$;

create or replace function public.mark_my_notices_read()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  update public.notices set is_read = true where user_id = auth.uid() and is_read = false;
  return jsonb_build_object('message', 'Notificações atualizadas.', 'state', public.get_my_voyage_state());
end;
$$;

revoke all on function public.create_mobile_profile() from public;
revoke all on function public.sync_mobile_profile_email() from public;
revoke all on function public.get_my_voyage_state() from public;
revoke all on function public.update_my_profile(text) from public;
revoke all on function public.set_my_card(text, text, text) from public;
revoke all on function public.create_virtual_card(text, text) from public;
revoke all on function public.remove_my_card() from public;
revoke all on function public.recharge_my_wallet(numeric, text) from public;
revoke all on function public.purchase_my_pass(text) from public;
revoke all on function public.board_my_line(text) from public;
revoke all on function public.toggle_my_favorite_line(text) from public;
revoke all on function public.add_my_favorite_route(text, text) from public;
revoke all on function public.remove_my_favorite_route(uuid) from public;
revoke all on function public.mark_my_notices_read() from public;

grant execute on function public.get_my_voyage_state() to authenticated;
grant execute on function public.update_my_profile(text) to authenticated;
grant execute on function public.set_my_card(text, text, text) to authenticated;
grant execute on function public.create_virtual_card(text, text) to authenticated;
grant execute on function public.remove_my_card() to authenticated;
grant execute on function public.recharge_my_wallet(numeric, text) to authenticated;
grant execute on function public.purchase_my_pass(text) to authenticated;
grant execute on function public.board_my_line(text) to authenticated;
grant execute on function public.toggle_my_favorite_line(text) to authenticated;
grant execute on function public.add_my_favorite_route(text, text) to authenticated;
grant execute on function public.remove_my_favorite_route(uuid) to authenticated;
grant execute on function public.mark_my_notices_read() to authenticated;
