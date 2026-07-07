import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
  isHighlighted?: boolean;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: 'github' | 'linkedin' | 'twitter' | 'slack';
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

  // GitHub repo URL
  readonly githubUrl = 'https://github.com/Jat21in/claim-management-system';
  readonly documentationUrl = 'https://jat21in.github.io/claim-management-system/';

  readonly columns: FooterColumn[] = [
    {
      heading: 'Pages',
      links: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Blog', href: '/blog' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Refund Policy', href: '/refund' },
        { label: 'GDPR', href: '/gdpr' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { 
          label: 'Documentation', 
          href: this.documentationUrl, 
          isExternal: true,
          isHighlighted: true 
        },
        { 
          label: 'GitHub Repository', 
          href: this.githubUrl, 
          isExternal: true 
        },
        { label: 'API Reference', href: '/api-docs' },
        { label: 'Support Center', href: '/support' },
        { label: 'Community', href: '/community' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Careers', href: '/careers' },
        { label: 'Press Kit', href: '/press' },
        { label: 'Changelog', href: '/changelog' },
        { label: 'Roadmap', href: '/roadmap' },
      ],
    },
    {
      heading: 'Connect',
      links: [
        { label: 'Twitter/X', href: 'https://twitter.com/claimcore', isExternal: true },
        { label: 'LinkedIn', href: 'https://linkedin.com/company/claimcore', isExternal: true },
        { label: 'YouTube', href: 'https://youtube.com/claimcore', isExternal: true },
        { label: 'Discord', href: 'https://discord.gg/claimcore', isExternal: true },
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    { 
      name: 'GitHub', 
      href: this.githubUrl, 
      icon: 'github' 
    },
    { 
      name: 'LinkedIn', 
      href: 'https://linkedin.com/company/claimcore', 
      icon: 'linkedin' 
    },
    { 
      name: 'Twitter',  
      href: 'https://twitter.com/claimcore', 
      icon: 'twitter'  
    },
    { 
      name: 'Slack',    
      href: 'https://claimcore.slack.com', 
      icon: 'slack'    
    },
  ];
}