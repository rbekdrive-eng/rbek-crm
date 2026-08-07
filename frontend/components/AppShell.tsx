'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  LayoutDashboard,
  Building2,
  Target,
  KanbanSquare,
  ContactRound,
  CheckSquare2,
  HardHat,
  FileText,
  Diamond,
  CalendarDays,
  Settings,
  Search,
  Bell,
  LogOut,
} from 'lucide-react';

import {
  api,
  clearToken,
  getToken,
} from '@/lib/api';

const nav = [
  {
    href: '/dashboard',
    label: 'Visão Geral',
    icon: LayoutDashboard,
  },
  {
    href: '/empresas',
    label: 'Empresas',
    icon: Building2,
  },
  {
    href: '/oportunidades',
    label: 'Oportunidades',
    icon: Target,
  },
  {
    href: '/pipeline',
    label: 'Pipeline',
    icon: KanbanSquare,
  },
  {
    href: '/contatos',
    label: 'Contatos',
    icon: ContactRound,
  },
  {
    href: '/atividades',
    label: 'Atividades',
    icon: CheckSquare2,
  },
  {
    href: '/obras',
    label: 'Obras',
    icon: HardHat,
  },
  {
    href: '/licitacoes',
    label: 'Licitações',
    icon: FileText,
  },
  {
    href: '/evidencias',
    label: 'Evidências',
    icon: Diamond,
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [name, setName] = useState('Fernando');

  useEffect(() => {
    if (path === '/login') {
      setReady(true);
      return;
    }

    if (!getToken()) {
      router.replace('/login');
      return;
    }

    api<any>('/me')
      .then((user) => {
        setName(user.name || 'Fernando');
        setReady(true);
      })
      .catch(() => {
        clearToken();
        router.replace('/login');
      });
  }, [path, router]);

  if (!ready && path !== '/login') {
    return (
      <div className="loading-screen">
        Carregando plataforma…
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img
  src="/Logo R.bek_branco.png"
  alt="R.BEK Engenharia"
  className="brand-logo"
/>
        </div>

        <nav className="nav">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              className={path === href ? 'active' : ''}
              href={href}
              key={href}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>Sistema operacional</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="global-search">
            <Search size={18} strokeWidth={1.8} />

            <input
              placeholder="Buscar empresas, oportunidades, obras..."
              aria-label="Busca global"
            />
          </div>

          <div className="user">
            <button
              className="icon-btn"
              type="button"
              aria-label="Notificações"
            >
              <Bell size={18} strokeWidth={1.8} />
            </button>

            <div className="avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="user-meta">
              <b>{name}</b>
              <small>Administrador</small>
            </div>

            <button
              className="logout"
              type="button"
              onClick={() => {
                clearToken();
                router.push('/login');
              }}
            >
              <LogOut size={16} strokeWidth={1.8} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
}
