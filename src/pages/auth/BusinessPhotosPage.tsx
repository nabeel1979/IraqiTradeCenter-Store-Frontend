import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImagePlus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi, type StoreUserPhoto } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import client from '@/api/client';

export function BusinessPhotosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { token } = useAuthStore();

  const accountType = (location.state as { accountType?: string } | null)?.accountType ?? 'Customer';
  const isCompany = accountType === 'Company';
  const required = accountType === 'Trader' || accountType === 'Company';

  const [uploading, setUploading] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) navigate('/auth/register', { replace: true });
  }, [token, navigate]);

  const { data: photos = [] } = useQuery({
    queryKey: ['store-user-photos'],
    queryFn: authApi.listPhotos,
    enabled: !!token,
  });

  // تحميل المصغّرات (مصادقة عبر الترويسة)
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const p of photos) {
        if (thumbs[p.id]) continue;
        try {
          const res = await client.get(`/api/store/auth/photos/${p.id}`, { responseType: 'blob' });
          if (!alive) return;
          const url = URL.createObjectURL(res.data as Blob);
          setThumbs((prev) => ({ ...prev, [p.id]: url }));
        } catch { /* تجاهل */ }
      }
    })();
    return () => { alive = false; };
  }, [photos]);

  const onPick = () => fileRef.current?.click();

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue;
        await authApi.uploadPhoto(f);
      }
      await qc.invalidateQueries({ queryKey: ['store-user-photos'] });
      toast.success(t('photoUploaded'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('photoUploadError'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDelete = async (id: string) => {
    try {
      await authApi.deletePhoto(id);
      await qc.invalidateQueries({ queryKey: ['store-user-photos'] });
      toast.success(t('photoDeleted'));
    } catch {
      toast.error(t('registerError'));
    }
  };

  const finish = () => {
    if (required && photos.length === 0) {
      toast.error(t('photosRequiredHint'));
      return;
    }
    navigate('/account');
  };

  if (!token) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
            <ImagePlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('photosTitle')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{required ? t('photosSubtitleRequired') : t('photosSubtitle')}</p>
        </div>

        {isCompany && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('photosCompanyPending')}</span>
          </div>
        )}

        <div className="card p-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />

          <button
            type="button"
            onClick={onPick}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700"
          >
            {uploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <ImagePlus className="h-7 w-7" />}
            <span className="text-sm font-medium">{uploading ? t('photosUploading') : t('photosUpload')}</span>
          </button>

          {photos.length === 0 ? (
            <p className="mt-4 text-center text-sm text-gray-400">{t('photosEmpty')}</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {photos.map((p: StoreUserPhoto) => (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  {thumbs[p.id] ? (
                    <img src={thumbs[p.id]} alt={p.fileName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    className="absolute top-1 ltr:right-1 rtl:left-1 rounded-lg bg-red-500/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            {!required && (
              <button type="button" onClick={() => navigate('/account')} className="btn-outline flex-1">
                {t('photosSkip')}
              </button>
            )}
            <button type="button" onClick={finish} className="btn-primary flex-1">
              {t('photosFinish')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
