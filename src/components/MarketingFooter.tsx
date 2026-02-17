import { Link } from 'react-router-dom';
import { PandaLogo } from './PandaLogo';
import { openCookiePreferences } from '../hooks/useCookieConsent';
import { useTranslation } from '../hooks/useTranslation';

function MarketingFooter() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card/70 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-foreground">
              <PandaLogo size="sm" />
              <span className="text-lg font-semibold">
                Route<span className="text-primary">it</span>
              </span>
            </Link>
            <p className="text-sm text-mutedForeground">{t('footer.claim')}</p>
            <p className="text-xs text-mutedForeground">
              {t('footer.legalNote')}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('footer.product')}</h3>
            <ul className="space-y-2 text-sm text-mutedForeground">
              <li><a href="/#features" className="transition hover:text-foreground">{t('footer.features')}</a></li>
              <li><a href="/#how" className="transition hover:text-foreground">{t('footer.how')}</a></li>
              <li><Link to="/pricing" className="transition hover:text-foreground">{t('footer.pricing')}</Link></li>
              <li><Link to="/login" className="transition hover:text-foreground">{t('footer.login')}</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm text-mutedForeground">
              <li><Link to="/legal/terms" className="transition hover:text-foreground">{t('footer.terms')}</Link></li>
              <li><Link to="/legal/privacy" className="transition hover:text-foreground">{t('footer.privacy')}</Link></li>
              <li><Link to="/legal/cookies" className="transition hover:text-foreground">{t('footer.cookies')}</Link></li>
              <li><Link to="/legal/imprint" className="transition hover:text-foreground">{t('footer.imprint')}</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('footer.contact')}</h3>
            <ul className="space-y-2 text-sm text-mutedForeground">
              <li><Link to="/legal/contact" className="transition hover:text-foreground">{t('footer.legalContact')}</Link></li>
              <li><span>privacy@routeit.example</span></li>
              <li><span>Dirección legal pendiente</span></li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="text-left transition hover:text-foreground"
                >
                  {t('footer.cookiePrefs')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-4 text-xs text-mutedForeground md:flex-row md:items-center md:justify-between">
          <p>© {year} Routeit. {t('footer.rights')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/legal/privacy" className="transition hover:text-foreground">{t('footer.privacy')}</Link>
            <Link to="/legal/terms" className="transition hover:text-foreground">{t('footer.terms')}</Link>
            <Link to="/legal/cookies" className="transition hover:text-foreground">{t('footer.cookies')}</Link>
            <span>{t('footer.language')}: ES</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default MarketingFooter;
