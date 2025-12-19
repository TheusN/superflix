'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/services/tmdb';
import { HeroSection, SkeletonHero } from '@/components/content/HeroSection';
import { CategoryRow, SkeletonRow } from '@/components/content/CategoryRow';
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
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SkeletonHero />
        <div className="relative z-10 -mt-24 space-y-2 pb-24">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - rotates through top trending */}
      <HeroSection
        items={data?.trending.slice(0, 5)}
        autoRotate
        rotateInterval={8000}
      />

      {/* Content Rows - overlap hero slightly */}
      <div className="relative z-10 -mt-24 space-y-2 pb-24">
        {/* Trending with backdrop cards */}
        <CategoryRow
          title="Em Alta"
          items={data?.trending || []}
          showType
          href="/trending"
          variant="backdrop"
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
          variant="backdrop"
        />
      </div>
    </div>
  );
}
