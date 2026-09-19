-- Storage bucket for proof photos/videos, scoped by group so a member can
-- only write into their own group's folder: proofs/<group_id>/<user_id>/<file>.

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

create policy "group members read proofs bucket"
  on storage.objects for select
  using (
    bucket_id = 'proofs'
    and is_group_member((storage.foldername(name))[1]::uuid)
  );

create policy "members upload proofs to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'proofs'
    and is_group_member((storage.foldername(name))[1]::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );
