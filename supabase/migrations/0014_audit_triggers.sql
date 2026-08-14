-- 0014_audit_triggers.sql — auto-populate audit_log for the menu-editing surface.
-- audit_log already has auth_read_audit (staff read their tenant) but NO insert policy, so
-- writes come from this SECURITY DEFINER trigger (bypasses RLS). Wrapped in an exception
-- guard: an auditing failure must NEVER roll back the actual edit. Captures actor via
-- auth.uid() (the staff session's JWT) and the full before/after row for a diffable history.

create or replace function public.audit_row() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.audit_log (tenant_id, actor_id, action, entity, entity_id, before, after)
    values (
      coalesce(new.tenant_id, old.tenant_id),
      auth.uid(),
      tg_op,
      tg_table_name,
      coalesce(new.id, old.id),
      case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
      case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
    );
  exception when others then
    null; -- auditing is best-effort; never break the underlying write
  end;
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_items on public.items;
drop trigger if exists audit_categories on public.categories;
drop trigger if exists audit_menus on public.menus;
drop trigger if exists audit_groups on public.menu_groups;

create trigger audit_items after insert or update or delete on public.items
  for each row execute function public.audit_row();
create trigger audit_categories after insert or update or delete on public.categories
  for each row execute function public.audit_row();
create trigger audit_menus after insert or update or delete on public.menus
  for each row execute function public.audit_row();
create trigger audit_groups after insert or update or delete on public.menu_groups
  for each row execute function public.audit_row();
