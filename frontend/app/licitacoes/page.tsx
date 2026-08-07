'use client';

import AppShell from '@/components/AppShell';
import SimpleEntityPage from '@/components/SimpleEntityPage';

export default function Page() {
  return (
    <AppShell>
      <SimpleEntityPage
        title="Licitações"
        subtitle="Processos públicos e oportunidades em monitoramento."
        endpoint="/bids"
        columns={[
          {
            key: 'agency',
            label: 'Órgão',
          },
          {
            key: 'process_number',
            label: 'Processo',
          },
          {
            key: 'object',
            label: 'Objeto',
          },
          {
            key: 'deadline_at',
            label: 'Prazo',
            render: (x: any) =>
              x.deadline_at
                ? new Date(x.deadline_at).toLocaleDateString('pt-BR')
                : '—',
          },
          {
            key: 'status',
            label: 'Status',
          },
          {
            key: 'estimated_value',
            label: 'Valor',
            render: (x: any) =>
              x.estimated_value
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(x.estimated_value))
                : '—',
          },
        ]}
      />
    </AppShell>
  );
}
