import { Metadata } from 'next';
import { Business } from '@/types';

export function generateCatalogMetadata(business: Business): Metadata {
  return {
    title: `${business.name} - FlowCart`,
    description: business.description || `Shop at ${business.name} on FlowCart`,
    openGraph: {
      title: business.name,
      description: business.description || `Shop at ${business.name} on FlowCart`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: business.name,
      description: business.description || `Shop at ${business.name} on FlowCart`,
    },
  };
}

