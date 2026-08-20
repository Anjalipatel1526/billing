import React from 'react';
import { UNAIBillingTemplate } from './UNAIBillingTemplate';

export const TEMPLATE_NAMES = {
  UNAI_BILLING: 'UNAI Billing'
};

export const TEMPLATES_CONFIG = [
  {
    id: 'UNAI Billing',
    name: 'UNAI Billing',
    description: 'Signature UNAI Billing template with company watermark, theme accents, and landscape/portrait modes.',
    badge: 'Recommended'
  }
];

export const TemplateWrapper = ({ templateName, ...props }) => {
  return <UNAIBillingTemplate {...props} />;
};
