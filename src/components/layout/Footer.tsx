import Link from "next/link";
import Image from "next/image";
import { getMenuItems, getHomePage, getLegalPages } from '@/lib/wordpress';
import { WPMenuItem, SocialLink, ACFImage } from '@/types/wordpress';
import { getSiteUrl, DEFAULT_SOCIAL_URLS, toFrontendHref } from '@/lib/site-config';

function SocialIcon({ platform, className }: { platform: SocialLink['platform']; className?: string }) {
  const c = className ?? 'w-6 h-6';
  switch (platform) {
    case 'twitter':
      return (
        <svg className={c} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'github':
      return (
        <svg className={c} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={c} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={c} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={c} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return (
        <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
  }
}

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  let quickLinksItems: WPMenuItem[] = [];
  let legalLinks: { title: string; href: string; external?: boolean }[] = [];
  let footerCopyright = `© ${currentYear} Felix Seeger.`;
  let socialLinks: SocialLink[] = [];
  let footerImage: ACFImage | null = null;

  try {
    const homePage = await getHomePage();
    const acf = homePage?.meta_box ?? homePage?.acf;
    const quickLinksMenuSlug = acf?.footer_quick_links_menu?.trim() || 'quick-links';
    const legalMenuSlug = acf?.footer_legal_menu?.trim() || 'footer-legal';

    const [quickLinksMenu, secondaryMenu, legalMenu, legalPages] = await Promise.all([
      getMenuItems(quickLinksMenuSlug),
      getMenuItems('secondary-navigation'),
      getMenuItems(legalMenuSlug),
      getLegalPages(),
    ]);

    quickLinksItems = Array.isArray(quickLinksMenu) && quickLinksMenu.length > 0
      ? quickLinksMenu
      : Array.isArray(secondaryMenu) ? secondaryMenu : [];
    if (Array.isArray(legalMenu) && legalMenu.length > 0) {
      legalLinks = legalMenu.map((item: WPMenuItem) => {
        const { href, external } = toFrontendHref(item.url);
        return { title: item.title, href, external };
      });
    } else {
      legalLinks = legalPages.map((p) => ({ title: p.title, href: p.link }));
    }

    if (acf) {
      if (acf.footer_image && typeof acf.footer_image === 'object' && 'url' in acf.footer_image && acf.footer_image.url) {
        footerImage = acf.footer_image as ACFImage;
      }
      if (acf.footer_text?.trim()) footerCopyright = acf.footer_text.trim().replace(/\{\{year\}\}/g, String(currentYear));
      if (acf.social_links && Array.isArray(acf.social_links)) socialLinks = acf.social_links;
    }
  } catch (error) {
    console.error('Footer: failed to fetch menu or homepage:', error);
  }

  const navLinks: { title: string; href: string; external?: boolean }[] = [];
  if (quickLinksItems.length > 0) {
    quickLinksItems.forEach((item: WPMenuItem) => {
      const { href, external } = toFrontendHref(item.url);
      navLinks.push({ title: item.title, href, external });
    });
  } else {
    navLinks.push({ title: 'Home', href: '/' }, { title: 'About', href: '/about' }, { title: 'Contact', href: '/contact' });
  }
  legalLinks.forEach((item) => navLinks.push(item));
  if (legalLinks.length === 0) {
    navLinks.push({ title: 'Privacy Policy', href: '/privacy-policy' });
  }
  const hasImpress = navLinks.some((item) => item.href === '/impress' || item.href.endsWith('/impress') || item.href === '/impressum' || item.href.endsWith('/impressum'));
  if (!hasImpress) {
    navLinks.push({ title: 'Impress', href: '/impress' });
  }

  // Strip "All rights reserved" from copyright (default or from WordPress)
  const copyrightDisplay = footerCopyright.replace(/\s*[\.]?\s*All rights reserved\.?/gi, '').trim();

  return (
    <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6" suppressHydrationWarning>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4" suppressHydrationWarning>
          {/* Logo + Social icons */}
          <div className="flex items-center gap-3 shrink-0" suppressHydrationWarning>
            {footerImage && (
              <Link href="/" suppressHydrationWarning>
                <Image
                  src={footerImage.url}
                  alt={footerImage.alt || 'Footer logo'}
                  width={footerImage.width || 160}
                  height={footerImage.height || 48}
                  className="h-10 w-auto object-contain object-left transition-[filter] duration-300 brightness-0 saturate-100 invert-[0.65] dark:brightness-0 dark:invert"
                  unoptimized={process.env.NEXT_IMAGE_UNOPTIMIZED === 'true'}
                />
              </Link>
            )}
            <div className="flex items-center gap-4 shrink-0" suppressHydrationWarning>
              {socialLinks.length > 0 ? (
                socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    aria-label={link.platform}
                  >
                    <SocialIcon platform={link.platform} className="w-5 h-5" />
                  </a>
                ))
              ) : (
                (['linkedin', 'twitter', 'github'] as const).map((platform) => {
                  const url = DEFAULT_SOCIAL_URLS[platform];
                  if (!url) return null;
                  return (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" aria-label={platform}>
                      <SocialIcon platform={platform} className="w-5 h-5" />
                    </a>
                  );
                })
              )}
            </div>
          </div>

          {/* Navigation links */}
          <nav className="font-footer-mono flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Footer navigation" suppressHydrationWarning>
            {navLinks.map((item, index) => (
              <span key={item.href + index} className="inline-flex items-center gap-x-4">
                {index > 0 && <span className="text-zinc-400 dark:text-zinc-500 select-none" aria-hidden>|</span>}
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm uppercase text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link href={item.href} className="text-sm uppercase text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                    {item.title}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Copyright */}
          <div className="font-footer-mono flex items-center shrink-0" suppressHydrationWarning>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap" suppressHydrationWarning>
              {copyrightDisplay}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
