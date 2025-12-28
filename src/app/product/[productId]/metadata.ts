import { Metadata } from 'next';
import { Product } from '@/types';

export function generateProductMetadata(product: Product): Metadata {
  return {
    title: `${product.name} - FlowCart`,
    description: product.description || `Buy ${product.name} at FlowCart. Price: ₹${product.price.toFixed(2)}`,
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name} at FlowCart`,
      images: product.imageUrl ? [product.imageUrl] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || `Buy ${product.name} at FlowCart`,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

