
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';


const FooterIconLink: React.FC<{ href: string, children: React.ReactNode, ariaLabel: string }> = ({ href, children, ariaLabel}) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
    {children}
  </a>
);

const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const TwitterIcon = () => (
 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.47 2.525c.636-.247 1.363-.416 2.427-.465C9.93 2.013 10.284 2 11.07 2h1.245zM12 6.864a5.136 5.136 0 100 10.272 5.136 5.136 0 000-10.272zm0 8.468a3.332 3.332 0 110-6.664 3.332 3.332 0 010 6.664zm5.885-8.35a1.247 1.247 0 100-2.495 1.247 1.247 0 000 2.495z" clipRule="evenodd" />
  </svg>
);


export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer.companyName')}</h3>
            <ul role="list" className="mt-4 space-y-4">
              <li><Link to={ROUTE_PATHS.ABOUT_US} className="text-base text-gray-300 hover:text-white">{t('footer.aboutUs')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer.support')}</h3>
            <ul role="list" className="mt-4 space-y-4">
              <li><Link to={ROUTE_PATHS.CONTACT_US} className="text-base text-gray-300 hover:text-white">{t('footer.contactUs')}</Link></li>
              <li><Link to={ROUTE_PATHS.FAQ} className="text-base text-gray-300 hover:text-white">{t('footer.faq')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer.legal')}</h3>
            <ul role="list" className="mt-4 space-y-4">
              <li><Link to={ROUTE_PATHS.TERMS_OF_SERVICE} className="text-base text-gray-300 hover:text-white">{t('footer.termsOfService')}</Link></li>
              <li><Link to={ROUTE_PATHS.PRIVACY_POLICY} className="text-base text-gray-300 hover:text-white">{t('footer.privacyPolicy')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer.connect')}</h3>
             <div className="mt-4 flex space-x-6">
                <FooterIconLink href="https://facebook.com" ariaLabel="Facebook"><FacebookIcon/></FooterIconLink>
                <FooterIconLink href="https://instagram.com" ariaLabel="Instagram"><InstagramIcon/></FooterIconLink>
                <FooterIconLink href="https://twitter.com" ariaLabel="Twitter"><TwitterIcon/></FooterIconLink>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">{t('footer.copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
};
