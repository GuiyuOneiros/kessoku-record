import React from 'react';
import { ExternalLink, Calendar } from 'lucide-react';
import { VideoLink, CategoryType } from '../types';

interface VideoCardProps {
  video: VideoLink;
  onVideoClick?: (video: VideoLink) => void;
  onTagSelect?: (tag: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onVideoClick,
  onTagSelect
}) => {
  const getBorderColor = (cat: CategoryType) => {
    switch (cat) {
      case CategoryType.ANIMATION: return 'hover:border-pink-400';
      case CategoryType.MUSIC: return 'hover:border-amber-400';
      case CategoryType.CONCERT: return 'hover:border-blue-400';
      case CategoryType.RADIO: return 'hover:border-red-400';
      case CategoryType.STAGE: return 'hover:border-purple-400';
      case CategoryType.ACTIVITY: return 'hover:border-emerald-400';
      default: return 'hover:border-gray-300';
    }
  };

  const getBadgeStyle = (cat: CategoryType) => {
    switch (cat) {
      case CategoryType.ANIMATION: return 'bg-pink-50 text-pink-600';
      case CategoryType.MUSIC: return 'bg-amber-50 text-amber-600';
      case CategoryType.CONCERT: return 'bg-blue-50 text-blue-600';
      case CategoryType.RADIO: return 'bg-red-50 text-red-600';
      case CategoryType.STAGE: return 'bg-purple-50 text-purple-600';
      case CategoryType.ACTIVITY: return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const tags = video.tags || [];

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onVideoClick?.(video)}
      className={`group flex flex-col justify-between bg-white rounded-xl p-4 border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${getBorderColor(video.category)}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <h3
            className="text-sm font-medium text-gray-800 group-hover:text-bili-pink transition-colors line-clamp-2 leading-snug"
            title={video.title}
          >
            {video.title}
          </h3>
          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-bili-pink flex-shrink-0 mt-0.5 transition-colors" />
        </div>

        {(video.subCategory || tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {video.subCategory && (
              <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-medium ${getBadgeStyle(video.category)}`}>
                {video.subCategory}
              </span>
            )}
            {tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                onClick={e => {
                  if (onTagSelect) {
                    e.preventDefault();
                    e.stopPropagation();
                    onTagSelect(tag);
                  }
                }}
                className={`inline-block px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500 ${
                  onTagSelect ? 'hover:bg-gray-800 hover:text-white cursor-pointer transition-colors' : ''
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {video.addedAt}
        </span>
        <span className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-bili-blue">
          Bilibili →
        </span>
      </div>
    </a>
  );
};