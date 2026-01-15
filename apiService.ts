
import { ContentPost, Credentials, PostStatus } from "./types";

/**
 * Strips all HTML tags from a string.
 */
const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * Retrieves all existing posts from the Teknowguy.com API.
 */
export const fetchLivePosts = async (userApiKey: string): Promise<ContentPost[]> => {
  const targetUrl = "https://teknowguy.com/api/blog/posts";
  const apiKey = userApiKey.trim();

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cloud repository: ${response.status}`);
  }

  const data = await response.json();
  const rawPosts = Array.isArray(data) ? data : (data.data || []);

  return rawPosts.map((p: any) => ({
    id: p.id || Math.random().toString(36).substr(2, 9),
    externalId: p.id,
    title: p.title || "Untitled Intelligence",
    excerpt: p.excerpt || stripHtml(p.content || "").substring(0, 150),
    fullBody: p.content || "",
    imageUrl: p.coverImage || "https://images.unsplash.com/photo-1518770660439-4636190af475",
    status: PostStatus.LIVE,
    scheduledDate: p.publishedAt || new Date().toISOString(),
    publishedAt: p.publishedAt,
    category: "Cloud Archive",
    contentType: 'News',
    seoKeywords: p.tags || [],
    variations: [] // Cloud posts may not have original variations stored
  }));
};

/**
 * Publishes a NEW editorial directly to the Teknowguy.com API.
 */
export const publishToLiveBlog = async (post: ContentPost, userApiKey: string): Promise<any> => {
  const targetUrl = "https://teknowguy.com/api/blog/posts";
  const apiKey = userApiKey.trim();

  // Ensure content is valid HTML
  let cleanContent = post.fullBody;
  if (!cleanContent.trim().startsWith('<')) {
    cleanContent = post.fullBody
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  // Ensure excerpt is strictly plain text
  const cleanExcerpt = stripHtml(post.excerpt || post.fullBody).substring(0, 250);

  const payload: any = {
    title: post.title.trim(),
    excerpt: cleanExcerpt,
    content: cleanContent,
    status: 'published',
    coverImage: post.imageUrl || "",
    tags: post.seoKeywords.length > 0 ? post.seoKeywords : ["Tech", "AI", "News"],
  };

  if (post.publishedAt || post.scheduledDate) {
    payload.publishedAt = post.publishedAt || post.scheduledDate;
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Site API Error: ${response.status}`);
  }

  return await response.json();
};

/**
 * Updates an EXISTING editorial on the Teknowguy.com API via PUT.
 */
export const updateLiveBlog = async (post: ContentPost, userApiKey: string): Promise<any> => {
  if (!post.externalId) throw new Error("No external ID found for this post.");
  
  const targetUrl = `https://teknowguy.com/api/blog/posts/${post.externalId}`;
  const apiKey = userApiKey.trim();

  // Ensure excerpt is strictly plain text
  const cleanExcerpt = stripHtml(post.excerpt || post.fullBody).substring(0, 250);

  const payload: any = {
    title: post.title.trim(),
    excerpt: cleanExcerpt,
    content: post.fullBody,
    status: 'published',
    coverImage: post.imageUrl || "",
    tags: post.seoKeywords.length > 0 ? post.seoKeywords : ["Tech", "AI", "News"]
  };

  const response = await fetch(targetUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Update Error: ${response.status}`);
  }

  return await response.json();
};

/**
 * Automated Facebook Dispatch
 */
export const publishToFacebook = async (content: string, imageUrl: string, creds: Credentials): Promise<boolean> => {
  if (!creds.facebookAccessToken || !creds.facebookPageId) {
    throw new Error("Facebook Credentials Missing");
  }

  const fbUrl = `https://graph.facebook.com/v19.0/${creds.facebookPageId}/feed`;
  const message = `${content}\n\nRead more at Teknowguy.com`;

  const response = await fetch("https://cors-publish.abacusai.app/api/proxy/publish", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-proxy-api-key': creds.blogApiKey.trim(),
      'x-target-url': fbUrl
    },
    body: JSON.stringify({
      message: message,
      link: imageUrl,
      access_token: creds.facebookAccessToken.trim()
    })
  });

  return response.ok;
};
