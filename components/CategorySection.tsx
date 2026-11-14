import React from 'react';
import { VideoLink, CategoryConfig } from '../types';
import { VideoCard } from './VideoCard';
import { Sparkles, Radio, Music, Calendar, Theater, Box } from 'lucide-react';

interface CategorySectionProps {
  meta: CategoryConfig;
  videos: VideoLink[];
}

const getIcon = (type: string) => {
    switch(type) {
        case 'Animation': return <Sparkles className="text-bili-pink" size={20} />;
        case 'Radio': return <Radio className="text-bili-blue" size={20} />;
        case 'Concert': return <Music className="text-purple-500" size={20} />;
        case 'Activity': return <Calendar className="text-green-500" size={20} />;
        case 'Stage': return <Theater className="text-orange-500" size={20} />;
        default: return <Box className="text-gray-500" size={20} />;
    }
}

export const CategorySection: React.FC<CategorySectionProps> = ({ meta, videos }) => {
  if (videos.length === 0) return null;

  return (
    <section id={meta.id} className="mb-6 scroll-mt-20">
      <div className="flex items-end gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
            {getIcon(meta.id)}
            <h2 className="text-lg font-bold text-gray-800 leading-none">{meta.label}</h2>
        </div>
        <div className="h-px bg-gray-200 flex-grow ml-2 mb-1.5"></div>
        <span className="text-xs text-gray-400 font-mono">
            {videos.length}
        </span>
      </div>
      
      {/* Dense grid for text-only cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
};