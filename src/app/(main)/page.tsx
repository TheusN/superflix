'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/services/tmdb';
import { HeroSection } from '@/components/content/HeroSection';
import { CategoryRow } from '@/components/content/CategoryRow';
import { SkeletonHero, SkeletonRow } from '@/components/ui/Skeleton';
import type { Content } from '@/types/content';

interface HomeData {
  trending: Content[];
  popularMovies: Content[];
  popularTv: Content[];
  topRatedMovies: Content[];
  topRatedTv: Content[];
  upcoming: Content[];
  anime: Content[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [heroContent, setHeroContent] = useState<Content | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [
        trendingRes,
        popularMoviesRes,
        popularTvRes,
        topRatedMoviesRes,
        topRatedTvRes,
        upcomingRes,
        animeRes,
      ] = await Promise.all([
        tmdb.getTrending('all', 'week'),
        tmdb.getPopular('movie'),
        tmdb.getPopular('tv'),
        tmdb.getTopRated('movie'),
        tmdb.getTopRated('tv'),
        tmdb.getUpcoming(),
        tmdb.getAnime(),
      ]);

      const homeData: HomeData = {
        trending: trendingRes.results || [],
        popularMovies: popularMoviesRes.results || [],
        popularTv: popularTvRes.results || [],
        topRatedMovies: topRatedMoviesRes.results || [],
        topRatedTv: topRatedTvRes.results || [],
        upcoming: upcomingRes.results || [],
        anime: animeRes.results || [],
      };

      setData(homeData);

      // Set random trending content as hero
      if (homeData.trending.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(5, homeData.trending.length));
        setHeroContent(homeData.trending[randomIndex]);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <SkeletonHero />
        <div className="space-y-8 py-8">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <HeroSection content={heroContent} />

      {/* Content Rows */}
      <div className="-mt-32 relative z-10 space-y-2">
        <CategoryRow
          title="Em Alta"
          items={data?.trending || []}
          showType
          href="/trending"
        />

        <CategoryRow
          title="Filmes Populares"
          items={data?.popularMovies || []}
          href="/movies"
        />

        <CategoryRow
          title="Séries Populares"
          items={data?.popularTv || []}
          href="/series"
        />

        <CategoryRow
          title="Animes"
          items={data?.anime || []}
          href="/anime"
        />

        <CategoryRow
          title="Filmes Mais Votados"
          items={data?.topRatedMovies || []}
        />

        <CategoryRow
          title="Séries Mais Votadas"
          items={data?.topRatedTv || []}
        />

        <CategoryRow
          title="Em Breve"
          items={data?.upcoming || []}
        />
      </div>
    </div>
  );
}
