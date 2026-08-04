-- 매물 스크린샷 업로드 지원. [sql]
-- 1) Listing.images — 이미지 URL 배열
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) 스토리지 버킷 listing-images (공개 읽기, 장당 10MB, 이미지만)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images', 'listing-images', true, 10485760,
        ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

-- 3) 업로드는 로그인 사용자가 자기 폴더({userId}/...)에만, 삭제도 자기 것만, 읽기는 공개
DROP POLICY IF EXISTS "listing_images_insert" ON storage.objects;
CREATE POLICY "listing_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "listing_images_delete" ON storage.objects;
CREATE POLICY "listing_images_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "listing_images_select" ON storage.objects;
CREATE POLICY "listing_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

\echo '===== 확인 ====='
SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'listing-images';
SELECT count(*) AS "images 컬럼 있는 Listing" FROM "Listing" WHERE images IS NOT NULL;
