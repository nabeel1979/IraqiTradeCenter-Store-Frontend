import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { toGoogleMapEmbedUrl, toGoogleMapOpenUrl } from '@/lib/mapEmbed';
import { Spinner } from '@/components/ui/Spinner';

interface Props {
  companyCode: string;
  companyName: string;
  onClose: () => void;
}

export function CompanyContactDialog({ companyCode, companyName, onClose }: Props) {
  const { t } = useTranslation();

  const { data: contact, isLoading, isError } = useQuery({
    queryKey: ['company-contact', companyCode],
    queryFn: () => companiesApi.getContact(companyCode),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const mapEmbed = toGoogleMapEmbedUrl(contact?.googleMapUrl, contact?.address);
  const mapOpenUrl = toGoogleMapOpenUrl(contact?.googleMapUrl, contact?.address);
  const displayName = contact?.name || companyName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-contact-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="company-contact-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {t('companyContactTitle')}
            </h2>
            <p className="text-sm text-gray-500">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label={t('cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red-500">{t('companyContactError')}</p>
        ) : (
          <div className="space-y-4">
            {contact?.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">{t('email')}</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-brand-600 hover:underline"
                    dir="ltr"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}

            {contact?.phones && contact.phones.length > 0 && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">{t('phone')}</p>
                  {contact.phones.map((p, i) => (
                    <a
                      key={i}
                      href={`tel:${p.replace(/\s/g, '')}`}
                      className="block text-sm text-brand-600 hover:underline num-display"
                      dir="ltr"
                    >
                      {p}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {contact?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">{t('address')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{contact.address}</p>
                </div>
              </div>
            )}

            {contact?.about && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">{t('companyAbout')}</p>
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {contact.about}
                  </p>
                </div>
              </div>
            )}

            {mapEmbed && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">{t('companyLocation')}</p>
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <iframe
                    title={t('companyLocation')}
                    src={mapEmbed}
                    className="h-56 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
                {mapOpenUrl && (
                  <a
                    href={mapOpenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {t('openInMaps')}
                  </a>
                )}
              </div>
            )}

            {!contact?.email &&
              !contact?.phones?.length &&
              !contact?.address &&
              !contact?.about &&
              !mapEmbed && (
                <p className="py-6 text-center text-sm text-gray-500">{t('companyContactEmpty')}</p>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
