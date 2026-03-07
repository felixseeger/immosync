'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import Menu, { type MenuLink, type MenuSubColumn, type MenuSocialLink } from '@/components/Menu/Menu';
import { DEFAULT_SOCIAL_URLS } from '@/lib/site-config';

export interface CourseItem {
  slug: string;
  title: string;
}

export interface CoursesMenuProps {
  /** Logo text in the menu bar (used when logoNode not set) */
  logo?: string;
  /** Fetched courses to list (slug + title) */
  courses: CourseItem[];
  /** Userflow / signup pages (e.g. Sign up, Success) */
  userflowLinks?: MenuLink[];
  /** Optional override for social links */
  socialLinks?: MenuSocialLink[];
  /** Legal links shown below social in overlay footer */
  legalLinks?: MenuLink[];
}

const defaultUserflowLinks: MenuLink[] = [
  { href: '/courses', label: 'All courses' },
  { href: '/courses/signup', label: 'Sign up / Sign in' },
];

const defaultLegalLinks: MenuLink[] = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
];

const defaultSocialLinks: MenuSocialLink[] = [
  { href: DEFAULT_SOCIAL_URLS.twitter || '#', label: 'Twitter' },
  { href: DEFAULT_SOCIAL_URLS.instagram || '#', label: 'Instagram' },
  { href: DEFAULT_SOCIAL_URLS.linkedin || '#', label: 'LinkedIn' },
].filter((s) => s.href !== '#');

export default function CoursesMenu({
  logo = 'Courses',
  courses,
  userflowLinks = defaultUserflowLinks,
  socialLinks = defaultSocialLinks,
  legalLinks = defaultLegalLinks,
}: CoursesMenuProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mainLinks: MenuLink[] = useMemo(
    () => courses.map((c) => ({ href: `/courses/${c.slug}`, label: c.title })),
    [courses]
  );

  const subColumns: MenuSubColumn[] = useMemo(
    () => [
      {
        title: 'Courses',
        links: userflowLinks,
      },
    ],
    [userflowLinks]
  );

  const logoSrc = !mounted ? '/logo-light.svg' : (resolvedTheme === 'dark' ? '/logo-light.svg' : '/logo-dark.svg');
  const logoNode = (
    <Link href="/" className="block w-10 h-10 relative" onClick={(e) => e.stopPropagation()}>
      <Image
        src={logoSrc}
        alt="Home"
        width={40}
        height={40}
        className="w-full h-full object-contain"
      />
    </Link>
  );

  return (
    <Menu
      logo={logo}
      logoNode={logoNode}
      variant="glass"
      mainColumnTitle="Upcoming"
      mainLinks={mainLinks}
      subColumns={subColumns}
      socialLinks={socialLinks.length > 0 ? socialLinks : defaultSocialLinks}
      legalLinks={legalLinks}
    />
  );
}
