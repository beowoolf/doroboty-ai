-- Normalize existing ties without deleting profile data.
with ordered as (
  select id, row_number() over (partition by user_id order by sort_order, created_at desc, id) - 1 as position
  from public.candidate_experiences
)
update public.candidate_experiences e set sort_order = o.position from ordered o where e.id = o.id;
with ordered as (
  select id, row_number() over (partition by user_id order by sort_order, created_at desc, id) - 1 as position
  from public.candidate_work_samples
)
update public.candidate_work_samples e set sort_order = o.position from ordered o where e.id = o.id;

create function public.append_candidate_item_order() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || tg_table_name, 0));
  execute format('select coalesce(max(sort_order) + 1, 0) from public.%I where user_id = $1', tg_table_name)
    into new.sort_order using new.user_id;
  return new;
end;
$$;
create trigger append_experience_order before insert on public.candidate_experiences
for each row execute function public.append_candidate_item_order();
create trigger append_work_sample_order before insert on public.candidate_work_samples
for each row execute function public.append_candidate_item_order();

create function public.move_candidate_item(target_id uuid, item_kind text, direction text)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  table_name text;
  item_ids uuid[];
  current_position integer;
  target_position integer;
  swapped_id uuid;
begin
  if auth.uid() is null or public.current_profile_role() <> 'candidate' then
    raise exception 'Candidate session required';
  end if;
  if item_kind not in ('experience', 'work_sample') or direction not in ('up', 'down')
     or item_kind is null or direction is null then
    raise exception 'Invalid move';
  end if;
  table_name := case item_kind when 'experience' then 'candidate_experiences' else 'candidate_work_samples' end;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || table_name, 0));
  execute format('select array_agg(id order by sort_order, created_at desc, id) from public.%I where user_id = $1', table_name)
    into item_ids using auth.uid();
  current_position := array_position(item_ids, target_id);
  if current_position is null then raise exception 'Item unavailable'; end if;
  target_position := current_position + case direction when 'up' then -1 else 1 end;
  if target_position < 1 or target_position > array_length(item_ids, 1) then return; end if;
  swapped_id := item_ids[target_position];
  item_ids[target_position] := target_id;
  item_ids[current_position] := swapped_id;
  execute format('update public.%I e set sort_order = o.position - 1 from unnest($1::uuid[]) with ordinality o(id, position) where e.id = o.id and e.user_id = $2', table_name)
    using item_ids, auth.uid();
end;
$$;
revoke all on function public.append_candidate_item_order() from public, anon, authenticated;
revoke all on function public.move_candidate_item(uuid, text, text) from public, anon;
grant execute on function public.move_candidate_item(uuid, text, text) to authenticated;
