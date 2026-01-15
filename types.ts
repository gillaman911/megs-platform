
export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE' // Published to the actual external website
}

export type ContentType = 'News' | 'Tip';

export type ConnectionMode = 'direct' | 'bridge' | 'manual';

export interface SocialVariation {
  platform: 'Facebook' | 'Instagram' | 'X' | 'LinkedIn' | 'YouTube Script';
  content: string;
  hashtags: string[];
  status?: 'draft' | 'queued' | 'dispatching' | 'published' | 'failed';
  approved?: boolean;
  scheduledAt?: string;
  error?: string;
}

export interface ContentPost {
  id: string;
  title: string;
  excerpt: string;
  fullBody: string;
  imageUrl?: string;
  status: PostStatus;
  scheduledDate: string; // The time user intended to publish/schedule
  publishedAt?: string; // The official ISO string for the API
  category: string;
  contentType: ContentType;
  seoKeywords: string[];
  variations: SocialVariation[];
  sourceUrl?: string;
  externalId?: string; // ID returned from the blog API
  youtubeScript?: string;
  promoVideoUrl?: string;
}

export interface TechNewsTrend {
  title: string;
  snippet: string;
  source: string;
  url: string;
}

export interface Credentials {
  blogApiKey: string;
  adobeExpressEndpoint: string;
  adobeAccessToken?: string;
  facebookAccessToken?: string;
  facebookPageId?: string;
  autoPilotEnabled: boolean;
  connectionMode: ConnectionMode;
  geminiApiKey?: string;
}
