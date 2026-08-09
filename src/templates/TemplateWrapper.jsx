import React from 'react';
import { UNAIBillingTemplate } from './UNAIBillingTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { ProfessionalTemplate } from './ProfessionalTemplate';
import { ModernTemplate } from './ModernTemplate';
import { ClassicTemplate } from './ClassicTemplate';

export const TEMPLATE_NAMES = {
  UNAI_BILLING: 'UNAI Billing',
  MINIMAL: 'Minimal',
  PROFESSIONAL: 'Professional',
  MODERN: 'Modern',
  CLASSIC: 'Classic'
};

export const TEMPLATES_CONFIG = [
  {
    id: 'UNAI Billing',
    name: 'UNAI Billing',
    description: 'Signature UNAI Billing template with company watermark, theme accents, and landscape/portrait modes.',
    badge: 'Recommended'
  },
  {
    id: 'Minimal',
    name: 'Minimal',
    description: 'Clean Linear-style template with subtle spacing and high clarity.',
    badge: 'Popular'
  },
  {
    id: 'Professional',
    name: 'Professional',
    description: 'Corporate executive layout with high-contrast header and structured details.',
    badge: 'Corporate'
  },
  {
    id: 'Modern',
    name: 'Modern',
    description: 'Contemporary tech SaaS design with gradient accents and rounded cards.',
    badge: 'Modern'
  },
  {
    id: 'Classic',
    name: 'Classic',
    description: 'Timeless traditional accounting format with formal borders and clear rules.',
    badge: 'Standard'
  }
];

export const TemplateWrapper = ({ templateName, company, customer, items, totals, document }) => {
  const selected = templateName || company?.selectedTemplate || TEMPLATE_NAMES.UNAI_BILLING;

  switch (selected) {
    case TEMPLATE_NAMES.PROFESSIONAL:
      return <ProfessionalTemplate company={company} customer={customer} items={items} totals={totals} document={document} />;
    case TEMPLATE_NAMES.MODERN:
      return <ModernTemplate company={company} customer={customer} items={items} totals={totals} document={document} />;
    case TEMPLATE_NAMES.CLASSIC:
      return <ClassicTemplate company={company} customer={customer} items={items} totals={totals} document={document} />;
    case TEMPLATE_NAMES.MINIMAL:
      return <MinimalTemplate company={company} customer={customer} items={items} totals={totals} document={document} />;
    case TEMPLATE_NAMES.UNAI_BILLING:
    default:
      return <UNAIBillingTemplate company={company} customer={customer} items={items} totals={totals} document={document} />;
  }
};
