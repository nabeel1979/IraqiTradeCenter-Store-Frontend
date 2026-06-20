import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * ماسح رمز QR احترافي يعمل عبر الكاميرا (يفضّل الخلفية) — متوافق مع PWA.
 * يُعيد النص المقروء عبر onResult ثم يغلق الكاميرا تلقائياً.
 */
export function QrScannerModal({
  onClose,
  onResult,
}: {
  onClose: () => void;
  onResult: (text: string) => void;
}) {
  const { t } = useTranslation();
  const rawId = useId();
  const regionId = `qr-reader-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const handledRef = useRef(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(regionId, { verbose: false } as never);

    const stopScanner = async () => {
      try {
        const state = scanner.getState?.();
        // 2 = SCANNING في html5-qrcode
        if (state === 2) await scanner.stop();
      } catch { /* تجاهل */ }
      try { scanner.clear(); } catch { /* تجاهل */ }
    };

    const onDecoded = (text: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      stopScanner().finally(() => onResult(text.trim()));
    };

    const config = { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 };

    (async () => {
      try {
        await scanner.start({ facingMode: 'environment' }, config, onDecoded, () => {});
        if (!cancelled) setStarting(false);
      } catch {
        // fallback: اختيار كاميرا من القائمة (سطح المكتب / لا توجد خلفية)
        try {
          const cams = await Html5Qrcode.getCameras();
          if (cancelled) return;
          if (!cams || cams.length === 0) { setError(t('qrNoCamera')); setStarting(false); return; }
          const back = cams.find((c) => /back|rear|environment|خلف/i.test(c.label)) ?? cams[cams.length - 1];
          await scanner.start(back.id, config, onDecoded, () => {});
          if (!cancelled) setStarting(false);
        } catch {
          if (!cancelled) { setError(t('qrCameraError')); setStarting(false); }
        }
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-semibold">{t('qrScanTitle')}</span>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10" aria-label={t('close')}>
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center text-white/90">
            <AlertCircle className="h-10 w-10 text-amber-400" />
            <p className="max-w-xs text-sm">{error}</p>
            <button onClick={onClose} className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/25">
              {t('close')}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="relative overflow-hidden rounded-2xl border-2 border-white/20 bg-black">
              <div id={regionId} className="[&_video]:!w-full [&_video]:rounded-2xl" />
            </div>
            <p className="mt-4 text-center text-sm text-white/80">
              {starting ? t('qrStarting') : t('qrScanHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
