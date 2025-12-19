'use client';

import { useState, useEffect } from 'react';
import { ContentGrid } from '@/components/content/ContentGrid';
import { Button } from '@/components/ui/Button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Content } from '@/types/content';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [releases, setReleases] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar days
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(year, month);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      loadReleasesForDate(date);
    }
  };

  const loadReleasesForDate = async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Fetch releases for the selected date from TMDB
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb'}&language=pt-BR&primary_release_date.gte=${dateStr}&primary_release_date.lte=${dateStr}&sort_by=popularity.desc`
      );

      if (response.ok) {
        const data = await response.json();
        setReleases(data.results?.map((item: Content) => ({
          ...item,
          media_type: 'movie'
        })) || []);
      }
    } catch (error) {
      console.error('Error loading releases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Calendar size={32} className="text-[var(--accent-primary)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Calendário de Lançamentos
          </h1>
          <p className="text-[var(--text-secondary)]">
            Veja os lançamentos de filmes por data
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-[var(--text-secondary)] py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  disabled={!date}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm
                    transition-colors
                    ${!date ? 'invisible' : 'hover:bg-[var(--bg-tertiary)]'}
                    ${isToday(date) ? 'bg-[var(--accent-primary)] text-white' : ''}
                    ${isSelected(date) && !isToday(date) ? 'ring-2 ring-[var(--accent-primary)]' : ''}
                    ${date && !isToday(date) ? 'text-[var(--text-primary)]' : ''}
                  `}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>

            {/* Today Button */}
            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDate(today);
                loadReleasesForDate(today);
              }}
            >
              Ir para Hoje
            </Button>
          </div>
        </div>

        {/* Releases */}
        <div className="lg:col-span-2">
          {selectedDate ? (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Lançamentos em {selectedDate.toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <ContentGrid
                items={releases}
                isLoading={isLoading}
                columns={4}
                emptyMessage="Nenhum lançamento nesta data"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-[var(--bg-secondary)] rounded-lg">
              <div className="text-center">
                <Calendar size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />
                <p className="text-[var(--text-secondary)]">
                  Selecione uma data no calendário para ver os lançamentos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
