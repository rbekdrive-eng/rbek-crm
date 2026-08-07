'use client';

import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { Opportunity } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loading, ErrorBox } from '@/components/State';

type PipelineStage = {
  label: string;
  aliases: string[];
};

const stages: PipelineStage[] = [
  {
    label: 'Identificada',
    aliases: [
      'Identificada',
      'Qualificação urgente',
      'Qualificação',
      'Nova',
      'Novo',
      'Aberta',
      'Ativa',
    ],
  },
  {
    label: 'Em análise',
    aliases: [
      'Em análise',
      'Em analise',
      'Análise',
      'Analise',
      'Em avaliação',
      'Em avaliacao',
    ],
  },
  {
    label: 'Contato iniciado',
    aliases: [
      'Contato iniciado',
      'Contato',
      'Prospecção',
      'Prospeccao',
      'Em contato',
    ],
  },
  {
    label: 'Proposta enviada',
    aliases: [
      'Proposta enviada',
      'Proposta',
      'Proposta comercial',
    ],
  },
  {
    label: 'Negociação',
    aliases: [
      'Negociação',
      'Negociacao',
      'Em negociação',
      'Em negociacao',
    ],
  },
  {
    label: 'Ganha',
    aliases: [
      'Ganha',
      'Ganho',
      'Fechada ganha',
      'Fechado ganho',
      'Convertida',
    ],
  },
];

const normalize = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const getStage = (status?: string | null) => {
  const normalizedStatus = normalize(status);

  const found = stages.find((stage) =>
    stage.aliases.some((alias) => normalize(alias) === normalizedStatus)
  );

  // Registros antigos ou com status ainda não mapeado
  // aparecem em "Identificada" em vez de desaparecer do Kanban.
  return found?.label || 'Identificada';
};

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);

export default function Pipeline() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    setErr('');

    return api<{ data: Opportunity[] }>(
      '/opportunities?per_page=300'
    )
      .then((response) => {
        setItems(response.data);
      })
      .catch((error) => {
        setErr(error.message || 'Não foi possível carregar o pipeline.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    void load();
  }, []);

  async function move(id: number, status: string) {
    const previousItems = items;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );

    try {
      await api(`/opportunities/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (error: any) {
      setItems(previousItems);

      alert(
        error?.message ||
          'Não foi possível atualizar a fase da oportunidade.'
      );
    }
  }

  return (
    <AppShell>
      <div className="title-row">
        <div>
          <span className="eyebrow">PIPELINE VISUAL</span>

          <h1>Kanban comercial</h1>

          <p>
            Arraste as oportunidades para atualizar a fase do negócio.
          </p>
        </div>

        <a className="btn primary" href="/oportunidades">
          + Nova oportunidade
        </a>
      </div>

      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : (
        <div className="kanban">
          {stages.map((stage) => {
            const list = items.filter(
              (item) => getStage(item.status) === stage.label
            );

            return (
              <section
                className="column"
                key={stage.label}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const id = Number(
                    event.dataTransfer.getData('id')
                  );

                  if (id) {
                    void move(id, stage.label);
                  }
                }}
              >
                <div className="column-head">
                  <h3>{stage.label}</h3>

                  <span>{list.length}</span>
                </div>

                {list.length === 0 ? (
                  <div className="column-empty">
                    Nenhuma oportunidade
                  </div>
                ) : (
                  list.map((item) => (
                    <article
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData(
                          'id',
                          String(item.id)
                        )
                      }
                      className="deal"
                      key={item.id}
                    >
                      <div className="deal-score">
                        {item.score ?? 0}
                      </div>

                      <strong>{item.title}</strong>

                      <small>
                        {item.company?.trade_name ||
                          'Empresa não informada'}
                      </small>

                      <div className="deal-bottom">
                        <b>
                          {money(
                            Number(item.potential_value || 0)
                          )}
                        </b>

                        <span>
                          {item.probability ?? 0}%
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
