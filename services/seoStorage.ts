
import { SeoConfig } from '../types';

const SEO_STORAGE_KEY = 'character_studio_seo';

const DEFAULT_SEO: SeoConfig = {
  title: 'Character Studio AI',
  description: 'Generate and edit professional character design sheets using Gemini 3 Pro Image.',
  keywords: 'AI, Character Design, 3D Art, Toy Design, Gemini, Brand Sheet',
  author: 'Character Studio AI',
  supportLink: 'https://buy.stripe.com/28E5kDgVC9dl6AE8Wy'
};

export const seoStorage = {
  getSeoConfig(): SeoConfig {
    try {
      const stored = localStorage.getItem(SEO_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SEO;
    } catch {
      return DEFAULT_SEO;
    }
  },

  saveSeoConfig(config: SeoConfig) {
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(config));
    this.applyToDocument();
  },

  applyToDocument() {
    const config = this.getSeoConfig();
    
    // Update Title
    document.title = config.title;

    // Helper to set meta tag
    const setMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set Open Graph tag
    const setOgTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('description', config.description);
    setMetaTag('keywords', config.keywords);
    setMetaTag('author', config.author);

    // Update Open Graph tags for social sharing
    setOgTag('og:title', config.title);
    setOgTag('og:description', config.description);
    setOgTag('og:type', 'website');
  }
};
