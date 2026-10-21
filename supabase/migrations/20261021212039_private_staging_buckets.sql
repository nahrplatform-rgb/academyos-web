-- Staging containers only. No client object policies are granted here.
-- Tenant-aware upload/download permissions follow the approved membership model.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('academy-media', 'academy-media', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('support-attachments', 'support-attachments', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('exports', 'exports', false, 20971520, array['text/csv','application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
