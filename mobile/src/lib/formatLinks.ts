import { fetchedLinkType, ContentType } from '@/types';

/**
 * Normalises a raw UserLink[] from the server (with populated linkId) into
 * the flat fetchedLinkType[] shape that the UI expects.
 *
 * Each UserLink document looks like:
 * {
 *   _id, userId, collectionId, linkId: { title, description, link, image, contentType },
 *   customTitle, customDescription, isChecked, createdAt, updatedAt, __v
 * }
 */
export function formatLinksForMobile(raw: any[]): fetchedLinkType[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((ul) => ({
    _id: ul._id,
    userId: ul.userId ?? '',
    collectionId: ul.collectionId ?? '',
    title: ul.customTitle || ul.linkId?.title || 'Untitled',
    description: ul.customDescription || ul.linkId?.description || '',
    link: ul.linkId?.link || ul.link || '',
    image: ul.linkId?.image ?? null,
    contentType: (ul.linkId?.contentType ?? 'link') as ContentType,
    isChecked: ul.isChecked ?? false,
    createdAt: ul.createdAt ?? '',
    updatedAt: ul.updatedAt ?? '',
    __v: ul.__v ?? 0,
  }));
}
