'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ContentGrid } from '@/components/content/ContentGrid';
import { SkeletonProfile } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import {
  User,
  Heart,
  Clock,
  Settings,
  LogOut,
  Moon,
  Sun,
  Trash2,
  Save,
} from 'lucide-react';
import type { Content } from '@/types/content';
import type { WatchHistoryItem } from '@/types/user';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Content[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setIsLoadingData(true);
    try {
      const [historyRes] = await Promise.all([
        fetch('/api/history'),
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Nome não pode estar vazio', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(name.trim());
      showToast('Perfil atualizado com sucesso', 'success');
    } catch (error: any) {
      showToast(error.message || 'Erro ao atualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o histórico?')) return;

    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        showToast('Histórico limpo com sucesso', 'success');
      }
    } catch (error) {
      showToast('Erro ao limpar histórico', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
    return <SkeletonProfile />;
  }

  // Convert history to content format for grid
  const historyAsContent: Content[] = history.map((item) => ({
    id: item.tmdb_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: null,
    media_type: item.media_type as 'movie' | 'tv',
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
    overview: '',
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-3xl font-bold">
          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {user.name || 'Usuário'}
          </h1>
          <p className="text-[var(--text-secondary)]">{user.email}</p>
          {user.isAdmin && (
            <span className="inline-block mt-2 px-2 py-1 bg-[var(--accent-primary)] text-white text-xs rounded">
              Administrador
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history">
        <TabsList className="mb-8">
          <TabsTrigger value="history">
            <Clock size={16} className="mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart size={16} className="mr-2" />
            Favoritos
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings size={16} className="mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Histórico de Visualização
            </h2>
            {history.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearHistory}
                className="gap-2"
              >
                <Trash2 size={16} />
                Limpar
              </Button>
            )}
          </div>

          <ContentGrid
            items={historyAsContent}
            isLoading={isLoadingData}
            showType
            columns={6}
            emptyMessage="Nenhum conteúdo assistido ainda"
          />
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
            Meus Favoritos
          </h2>

          <ContentGrid
            items={favorites}
            isLoading={isLoadingData}
            showType
            columns={6}
            emptyMessage="Nenhum favorito ainda"
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="max-w-lg space-y-8">
            {/* Profile Settings */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Perfil
              </h3>
              <div className="space-y-4">
                <Input
                  label="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User size={18} />}
                />
                <Button
                  onClick={handleSaveProfile}
                  loading={isSaving}
                  className="gap-2"
                >
                  <Save size={18} />
                  Salvar Alterações
                </Button>
              </div>
            </div>

            {/* Theme Settings */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Aparência
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-primary)]">Tema</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {theme === 'dark' ? 'Modo escuro' : 'Modo claro'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    'w-12 h-6 rounded-full relative transition-colors',
                    theme === 'dark'
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--bg-tertiary)]'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform flex items-center justify-center',
                      theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                    )}
                  >
                    {theme === 'dark' ? (
                      <Moon size={10} className="text-[var(--accent-primary)]" />
                    ) : (
                      <Sun size={10} className="text-yellow-500" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Conta
              </h3>
              <Button variant="danger" onClick={handleLogout} className="gap-2">
                <LogOut size={18} />
                Sair da Conta
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
