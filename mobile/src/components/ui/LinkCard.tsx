/**
 * LinkCard — smart router that selects the right card component based on
 * the link's `contentType`. Falls back to GenericLinkCard for unknown types
 * and for legacy links that have no `contentType` set.
 */
import React from 'react';
import { fetchedLinkType } from '@/types';
import { GenericLinkCard } from './link-cards/GenericLinkCard';
import { YouTubeCard } from './link-cards/YouTubeCard';
import { TwitterCard } from './link-cards/TwitterCard';
import { GitHubCard } from './link-cards/GitHubCard';
import { InstagramCard } from './link-cards/InstagramCard';
import { ImageCard } from './link-cards/ImageCard';
import { AudioCard } from './link-cards/AudioCard';
import { ArticleCard } from './link-cards/ArticleCard';
import { BookCard } from './link-cards/BookCard';
import { MovieCard } from './link-cards/MovieCard';
import { ProductCard } from './link-cards/ProductCard';

type LinkCardProps = {
  link: fetchedLinkType;
  onLongPress?: () => void;
};

export function LinkCard({ link, onLongPress }: LinkCardProps) {
  const sharedProps = { link, onLongPress };

  switch (link.contentType) {
    case 'youtube':
      return <YouTubeCard {...sharedProps} />;
    case 'twitter':
      return <TwitterCard {...sharedProps} />;
    case 'github':
      return <GitHubCard {...sharedProps} />;
    case 'instagram':
      return <InstagramCard {...sharedProps} />;
    case 'image':
      return <ImageCard {...sharedProps} />;
    case 'audio':
      return <AudioCard {...sharedProps} />;
    case 'article':
      return <ArticleCard {...sharedProps} />;
    case 'book':
      return <BookCard {...sharedProps} />;
    case 'movie':
      return <MovieCard {...sharedProps} />;
    case 'product':
      return <ProductCard {...sharedProps} />;
    case 'link':
    default:
      // Handles null/undefined (old links) and the explicit 'link' type
      return <GenericLinkCard {...sharedProps} />;
  }
}
