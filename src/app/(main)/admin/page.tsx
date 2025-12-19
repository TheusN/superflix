'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  Users,
  Settings,
  Activity,
  Shield,
  Save,
  Search,
  RefreshCw,
} from 'lucide-react';
import type { AdminUser, AdminDashboard, AdminSettings } from '@/types/api';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    m3u_url: '',
    site_name: 'Superflix',
    maintenance_mode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!user.isAdmin) {
        router.push('/');
        showToast('Acesso negado. Apenas administradores.', 'error');
      } else {
        loadAdminData();
      }
    }
  }, [user, authLoading, router]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, usersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/users'),
        fetch('/api/admin/settings'),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboard(data);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('Configurações salvas com sucesso', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUserStatus = async (userId: number, status: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, status } : u))
        );
        showToast('Status atualizado', 'success');
      }
    } catch (error) {
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="text-[var(--accent-primary)]" />
            Painel Administrativo
          </h1>
          <p className="text-[var(--text-secondary)]">
            Gerencie usuários e configurações do sistema
          </p>
        </div>
        <Button variant="secondary" onClick={loadAdminData}>
          <RefreshCw size={18} className="mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Total de Usuários"
            value={dashboard.totalUsers}
            icon={<Users size={24} />}
          />
          <DashboardCard
            title="Usuários Ativos"
            value={dashboard.activeUsers}
            icon={<Activity size={24} />}
            variant="success"
          />
          <DashboardCard
            title="Novos (7 dias)"
            value={dashboard.newUsersLast7Days}
            icon={<Users size={24} />}
            variant="primary"
          />
          <DashboardCard
            title="Visualizações Hoje"
            value={dashboard.watchesToday}
            icon={<Activity size={24} />}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="mb-8">
          <TabsTrigger value="users">
            <Users size={16} className="mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings size={16} className="mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-[var(--border-color)]">
              <Input
                placeholder="Buscar usuários..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                icon={<Search size={18} />}
                className="max-w-sm"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
                      Criado em
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--bg-tertiary)]">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            {u.name || 'Sem nome'}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {u.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            u.status === 'active'
                              ? 'success'
                              : u.status === 'blocked'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {u.status === 'active'
                            ? 'Ativo'
                            : u.status === 'blocked'
                            ? 'Bloqueado'
                            : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <Badge variant="primary">Sim</Badge>
                        ) : (
                          <span className="text-[var(--text-secondary)]">Não</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          options={[
                            { value: 'active', label: 'Ativar' },
                            { value: 'blocked', label: 'Bloquear' },
                          ]}
                          value={u.status}
                          onChange={(e) =>
                            handleUpdateUserStatus(u.id, e.target.value)
                          }
                          className="w-32"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-[var(--text-secondary)]">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="max-w-2xl space-y-6">
            {/* Site Settings */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Configurações do Site
              </h3>
              <div className="space-y-4">
                <Input
                  label="Nome do Site"
                  value={settings.site_name}
                  onChange={(e) =>
                    setSettings({ ...settings, site_name: e.target.value })
                  }
                />
                <Input
                  label="URL da Playlist M3U"
                  value={settings.m3u_url}
                  onChange={(e) =>
                    setSettings({ ...settings, m3u_url: e.target.value })
                  }
                  placeholder="https://exemplo.com/playlist.m3u"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-primary)]">Modo Manutenção</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Desativa o acesso ao site para usuários não-admin
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        maintenance_mode: !settings.maintenance_mode,
                      })
                    }
                    className={cn(
                      'w-12 h-6 rounded-full relative transition-colors',
                      settings.maintenance_mode
                        ? 'bg-red-500'
                        : 'bg-[var(--bg-tertiary)]'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        settings.maintenance_mode
                          ? 'translate-x-7'
                          : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveSettings} loading={isSaving} className="gap-2">
              <Save size={18} />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({
  title,
  value,
  icon,
  variant = 'default',
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'success';
}) {
  const variantClasses = {
    default: 'bg-[var(--bg-secondary)]',
    primary: 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]',
    success: 'bg-green-500/10 border-green-500',
  };

  const iconClasses = {
    default: 'text-[var(--text-secondary)]',
    primary: 'text-[var(--accent-primary)]',
    success: 'text-green-500',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-6 border border-[var(--border-color)]',
        variantClasses[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={iconClasses[variant]}>{icon}</div>
      </div>
    </div>
  );
}
