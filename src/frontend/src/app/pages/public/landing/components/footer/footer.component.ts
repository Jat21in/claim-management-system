import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: 'linkedin' | 'twitter' | 'slack';
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly brandName = 'ClaimCore';
  readonly brandDescription =
  'Seamless claim management with real‑time tracking, AI‑powered approvals, and end‑to‑end transparency – built for the modern insurance ecosystem.';

  readonly columns: FooterColumn[] = [
    {
      heading: 'Pages',
      links: [
        { label: 'Home',      href: '#' },
        { label: 'About',     href: '#' },
        { label: 'Contact',   href: '#' },
        { label: 'Careers',   href: '#' },
        { label: 'Press',     href: '#' },
        { label: 'Blog',      href: '#' },
        { label: 'Changelog', href: '#' },
        { label: 'Roadmap',   href: '#' },
        { label: 'Pricing',   href: '#' },
        { label: 'FAQ',       href: '#' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Terms of Service', href: '#' },
        { label: 'Privacy Policy',   href: '#' },
        { label: 'Cookie Policy',    href: '#' },
        { label: 'Refund Policy',    href: '#' },
        { label: 'Acceptable Use',   href: '#' },
        { label: 'GDPR',             href: '#' },
        { label: 'Licenses',         href: '#' },
      ],
    },
    {
      heading: 'Components',
      links: [
        { label: 'Buttons',    href: '#' },
        { label: 'Cards',      href: '#' },
        { label: 'Navigation', href: '#' },
        { label: 'Forms',      href: '#' },
        { label: 'Modals',     href: '#' },
        { label: 'Tables',     href: '#' },
        { label: 'Alerts',     href: '#' },
        { label: 'Badges',     href: '#' },
        { label: 'Avatars',    href: '#' },
        { label: 'Tooltips',   href: '#' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Tutorials',     href: '#' },
        { label: 'Examples',      href: '#' },
        { label: 'Templates',     href: '#' },
        { label: 'Guides',        href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'Community',     href: '#' },
        { label: 'Support',       href: '#' },
      ],
    },
    {
      heading: 'Marketing',
      links: [
        { label: 'Best Place to Market AI Tools', href: '#' },
        { label: 'Product Hunt Launch',           href: '#' },
        { label: 'Indie Hackers',                 href: '#' },
        { label: 'Hacker News',                   href: '#' },
        { label: 'Twitter Marketing',             href: '#' },
        { label: 'Reddit Communities',            href: '#' },
        { label: 'Discord Servers',               href: '#' },
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    { name: 'LinkedIn', href: '#', icon: 'linkedin' },
    { name: 'Twitter',  href: '#', icon: 'twitter'  },
    { name: 'Slack',    href: '#', icon: 'slack'     },
  ];
}