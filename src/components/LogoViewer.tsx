import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Minus, Plus, RotateCcw, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export const DEFAULT_LOGO_SRC = '/logo.png?v=5';

type LogoViewerProps = {
  alt: string;
  src?: string;
  className?: string;
  buttonClassName?: string;
};

export function LogoViewer({ alt, src = DEFAULT_LOGO_SRC, className, buttonClassName }: LogoViewerProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setScale(1);
  };

  const modal = open ? (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* شريط التحكم — يُعرض فوق اللوكو دائماً */}
      <div
        className="relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-3 py-2.5 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-gray-900 shadow-lg transition hover:bg-white"
            onClick={close}
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
            <span className="hidden sm:inline">إغلاق</span>
          </button>
          <a
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-brand-600"
            href={src}
            download="iraqi-trade-center-logo.png"
            aria-label="تحميل اللوكو"
          >
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">تحميل</span>
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="rounded-full bg-white/95 p-2 text-gray-900 shadow hover:bg-white"
            onClick={() => setScale((v) => Math.max(0.6, v - 0.2))}
            aria-label="تصغير"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full bg-white/95 p-2 text-gray-900 shadow hover:bg-white"
            onClick={() => setScale((v) => Math.min(3, v + 0.2))}
            aria-label="تكبير"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full bg-white/95 p-2 text-gray-900 shadow hover:bg-white"
            onClick={() => setScale(1)}
            aria-label="إعادة الحجم"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* منطقة اللوكو */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center p-4"
        onClick={close}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[calc(100vh-4.5rem)] max-w-[min(90vw,720px)] object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className={cn('inline-flex shrink-0 cursor-zoom-in items-center justify-center', buttonClassName)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label="عرض اللوكو وتكبيره"
      >
        <img src={src} alt={alt} className={className} draggable={false} />
      </button>

      {modal && createPortal(modal, document.body)}
    </>
  );
}
