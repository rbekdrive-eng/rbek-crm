'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import Modal from './Modal';
import { Loading, ErrorBox, Empty } from './State';

type Bid = {
  id: number;
  agency: string;
  process_number?: string | null;
  object: string;
  city?: string | null;
  state_country?: string | null;
  published_at?: string | null;
  deadline_at?: string | null;
  estimated_value?: string | number | null;
  status: string;
  source_url?: string | null;
};

type BidForm = {
  agency: string;
  process_number: string;
  object: string;
  city: string;
  state_country: string;
  published_at: string;
  deadline_at: string;
  estimated_value: string;
  status: string;
  source_url: string;
};

const statuses = [
  'Monitoramento',
  'Publicada',
  'Em análise',
  'Preparando proposta',
  'Proposta enviada',
  'Aguardando resultado',
  'Vencida',
  'Perdida',
  'Cancelada',
];

const emptyForm: BidForm = {
  agency: '',
  process_number: '',
  object: '',
  city: '',
  state_country: '',
  published_at: '',
  deadline_at: '',
  estimated_value: '',
  status: 'Monitoramento',
  source_url: '',
};

function extractList<T>(response: any): T[] {
  const data =
    response?.data?.data ??
    response?.data ??
    response ??
    [];

  return Array.isArray(data) ? data : [];
}

function dateOnly(value?: string | null) {
  if (!value) return '';

  return value.slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const normalized = value.slice(0, 10);
  const [year, month, day] = normalized.split('-');

  if (!year || !month || !day) {
    return '—';
  }

  return `${day}/${month}/${year}`;
}

function formatMoney(value?: string | number | null) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
}

function statusStyle(status: string) {
  if (status === 'Vencida') {
    return {
      background: '#e7f6eb',
      color: '#25733b',
    };
  }

  if (status === 'Perdida' || status === 'Cancelada') {
    return {
      background: '#f4eeee',
      color: '#884848',
    };
  }

  if (
    status === 'Preparando proposta' ||
    status === 'Proposta enviada'
  ) {
    return {
      background: '#fff4df',
      color: '#936117',
    };
  }

  if (status === 'Aguardando resultado') {
    return {
      background: '#eef3f5',
      color: '#43565f',
    };
  }

  if (status === 'Em análise') {
    return {
      background: '#fff8e8',
      color: '#8c671f',
    };
  }

  return {
    background: '#eef0f1',
    color: '#555a5c',
  };
}

function daysUntil(value?: string | null) {
  if (!value) return null;

  const deadline = new Date(`${value.slice(0, 10)}T23:59:59`);
  const now = new Date();

  const difference =
    deadline.getTime() - now.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );
}

export default function BidManager() {
  const [items, setItems] = useState<Bid[]>([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<BidForm>(emptyForm);

  async function load() {
    try {
      setLoading(true);
      setErr('');

      const response = await api<any>(
        '/bids?per_page=300'
      );

      setItems(extractList<Bid>(response));
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível carregar as licitações.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return items.filter((bid) => {
      const matchesStatus =
        !statusFilter ||
        bid.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!search) {
        return true;
      }

      const content = [
        bid.agency,
        bid.process_number,
        bid.object,
        bid.city,
        bid.state_country,
        bid.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return content.includes(search);
    });
  }, [items, query, statusFilter]);

  const totalValue = useMemo(() => {
    return items.reduce(
      (total, bid) =>
        total + Number(bid.estimated_value || 0),
      0
    );
  }, [items]);

  const activeCount = useMemo(() => {
    return items.filter(
      (bid) =>
        bid.status !== 'Vencida' &&
        bid.status !== 'Perdida' &&
        bid.status !== 'Cancelada'
    ).length;
  }, [items]);

  const urgentCount = useMemo(() => {
    return items.filter((bid) => {
      const remaining = daysUntil(
        bid.deadline_at
      );

      return (
        remaining !== null &&
        remaining >= 0 &&
        remaining <= 7 &&
        bid.status !== 'Vencida' &&
        bid.status !== 'Perdida' &&
        bid.status !== 'Cancelada'
      );
    }).length;
  }, [items]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErr('');
    setOpen(true);
  }

  function openEdit(bid: Bid) {
    setEditing(bid.id);

    setForm({
      agency: bid.agency || '',
      process_number: bid.process_number || '',
      object: bid.object || '',
      city: bid.city || '',
      state_country: bid.state_country || '',
      published_at: dateOnly(bid.published_at),
      deadline_at: dateOnly(bid.deadline_at),
      estimated_value:
        bid.estimated_value !== null &&
        bid.estimated_value !== undefined
          ? String(bid.estimated_value)
          : '',
      status: bid.status || 'Monitoramento',
      source_url: bid.source_url || '',
    });

    setErr('');
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setErr('');
  }

  async function saveBid(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.agency.trim()) {
      setErr('Informe o órgão responsável.');
      return;
    }

    if (!form.object.trim()) {
      setErr('Informe o objeto da licitação.');
      return;
    }

    try {
      setSaving(true);
      setErr('');

      const payload = {
        agency: form.agency.trim(),

        process_number:
          form.process_number.trim() || null,

        object:
          form.object.trim(),

        city:
          form.city.trim() || null,

        state_country:
          form.state_country.trim() || null,

        published_at:
          form.published_at || null,

        deadline_at:
          form.deadline_at || null,

        estimated_value:
          form.estimated_value !== ''
            ? Number(
                form.estimated_value.replace(
                  ',',
                  '.'
                )
              )
            : null,

        status:
          form.status,

        source_url:
          form.source_url.trim() || null,
      };

      if (editing) {
        await api(`/bids/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/bids', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível salvar a licitação.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBid(bid: Bid) {
    const confirmed = window.confirm(
      `Deseja realmente excluir a licitação "${bid.process_number || bid.agency}"?`
    );

    if (!confirmed) return;

    try {
      setErr('');

      await api(`/bids/${bid.id}`, {
        method: 'DELETE',
      });

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível excluir a licitação.'
      );
    }
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#c78310',
              marginBottom: 8,
            }}
          >
            INTELIGÊNCIA DE MERCADO
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.15,
              color: '#202b33',
            }}
          >
            Licitações
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 18,
              color: '#6d7479',
            }}
          >
            Processos públicos e oportunidades em monitoramento.
          </p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={openCreate}
          style={{
            flexShrink: 0,
            minHeight: 48,
            paddingLeft: 22,
            paddingRight: 22,
          }}
        >
          + Nova licitação
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: 16,
          maxWidth: 1000,
          marginBottom: 22,
        }}
      >
        <div style={metricCard}>
          <span style={metricLabel}>
            Monitoradas
          </span>

          <strong style={metricNumber}>
            {items.length}
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Ativas
          </span>

          <strong style={metricNumber}>
            {activeCount}
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Prazo até 7 dias
          </span>

          <strong
            style={{
              ...metricNumber,
              color:
                urgentCount > 0
                  ? '#b87816'
                  : '#202b33',
            }}
          >
            {urgentCount}
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Valor estimado
          </span>

          <strong
            style={{
              ...metricNumber,
              fontSize: 20,
            }}
          >
            {formatMoney(totalValue)}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            width: '100%',
            maxWidth: 760,
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Buscar órgão, processo, objeto ou cidade..."
            style={{
              width: '100%',
              minHeight: 48,
              padding: '0 16px',
              border:
                '1px solid #d9dee3',
              borderRadius: 10,
              background: '#fff',
              fontSize: 16,
              outline: 'none',
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            style={{
              minWidth: 200,
              minHeight: 48,
              padding: '0 12px',
              border:
                '1px solid #d9dee3',
              borderRadius: 10,
              background: '#fff',
              fontSize: 15,
            }}
          >
            <option value="">
              Todos os status
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>

        <span
          style={{
            color: '#6b7280',
            whiteSpace: 'nowrap',
            fontSize: 14,
          }}
        >
          {filtered.length}{' '}
          {filtered.length === 1
            ? 'licitação'
            : 'licitações'}
        </span>
      </div>

      {err && !open ? (
        <ErrorBox message={err} />
      ) : null}

      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="Nenhuma licitação encontrada." />
      ) : (
        <div
          style={{
            background: '#fff',
            border:
              '1px solid #dde2e6',
            borderRadius: 18,
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: 1200,
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom:
                    '1px solid #e5e7eb',
                }}
              >
                <th style={headerStyle}>
                  ÓRGÃO / PROCESSO
                </th>

                <th style={headerStyle}>
                  OBJETO
                </th>

                <th style={headerStyle}>
                  LOCALIZAÇÃO
                </th>

                <th style={headerStyle}>
                  PUBLICAÇÃO
                </th>

                <th style={headerStyle}>
                  PRAZO
                </th>

                <th style={headerStyle}>
                  STATUS
                </th>

                <th style={headerStyle}>
                  VALOR
                </th>

                <th style={headerStyle}>
                  FONTE
                </th>

                <th style={headerStyle}>
                  AÇÕES
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((bid) => {
                const badge =
                  statusStyle(bid.status);

                const remaining =
                  daysUntil(bid.deadline_at);

                return (
                  <tr
                    key={bid.id}
                    style={{
                      borderBottom:
                        '1px solid #eef0f2',
                    }}
                  >
                    <td style={cellStyle}>
                      <strong
                        style={{
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        {bid.agency}
                      </strong>

                      <span
                        style={{
                          color: '#7b838b',
                          fontSize: 12,
                        }}
                      >
                        {bid.process_number ||
                          'Sem número'}
                      </span>
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        maxWidth: 330,
                      }}
                    >
                      {bid.object}
                    </td>

                    <td style={cellStyle}>
                      {[
                        bid.city,
                        bid.state_country,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>

                    <td style={cellStyle}>
                      {formatDate(
                        bid.published_at
                      )}
                    </td>

                    <td style={cellStyle}>
                      <strong
                        style={{
                          display: 'block',
                          marginBottom: 4,
                          color:
                            remaining !== null &&
                            remaining >= 0 &&
                            remaining <= 7
                              ? '#b87816'
                              : '#27313a',
                        }}
                      >
                        {formatDate(
                          bid.deadline_at
                        )}
                      </strong>

                      {remaining !== null &&
                      remaining >= 0 ? (
                        <span
                          style={{
                            fontSize: 11,
                            color:
                              remaining <= 7
                                ? '#b87816'
                                : '#7b838b',
                          }}
                        >
                          {remaining === 0
                            ? 'vence hoje'
                            : `${remaining} dias`}
                        </span>
                      ) : null}
                    </td>

                    <td style={cellStyle}>
                      <span
                        style={{
                          display:
                            'inline-flex',
                          padding:
                            '6px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          ...badge,
                        }}
                      >
                        {bid.status}
                      </span>
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 600,
                        whiteSpace:
                          'nowrap',
                      }}
                    >
                      {formatMoney(
                        bid.estimated_value
                      )}
                    </td>

                    <td style={cellStyle}>
                      {bid.source_url ? (
                        <a
                          href={bid.source_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#a76e17',
                            textDecoration:
                              'none',
                            fontWeight: 600,
                          }}
                        >
                          Abrir fonte ↗
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td style={cellStyle}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 14,
                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(bid)
                          }
                          style={
                            actionStyle
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void deleteBid(
                              bid
                            )
                          }
                          style={
                            actionStyle
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        title={
          editing
            ? 'Editar licitação'
            : 'Nova licitação'
        }
        onClose={closeModal}
      >
        <form onSubmit={saveBid}>
          {err && open ? (
            <div
              style={{
                marginBottom: 16,
              }}
            >
              <ErrorBox message={err} />
            </div>
          ) : null}

          <div className="form-grid">
            <label className="full">
              Órgão responsável

              <input
                type="text"
                value={form.agency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    agency:
                      event.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Número do processo

              <input
                type="text"
                value={
                  form.process_number
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    process_number:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Status

              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status:
                      event.target.value,
                  })
                }
                required
              >
                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="full">
              Objeto

              <textarea
                rows={4}
                value={form.object}
                onChange={(event) =>
                  setForm({
                    ...form,
                    object:
                      event.target.value,
                  })
                }
                placeholder="Descrição do objeto da licitação..."
                required
              />
            </label>

            <label>
              Cidade

              <input
                type="text"
                value={form.city}
                onChange={(event) =>
                  setForm({
                    ...form,
                    city:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Estado / País

              <input
                type="text"
                value={
                  form.state_country
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    state_country:
                      event.target.value,
                  })
                }
                placeholder="Ex.: PR / Brasil"
              />
            </label>

            <label>
              Data de publicação

              <input
                type="date"
                value={
                  form.published_at
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    published_at:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Prazo

              <input
                type="date"
                value={
                  form.deadline_at
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    deadline_at:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              Valor estimado

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.estimated_value
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    estimated_value:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              URL da fonte

              <input
                type="text"
                value={
                  form.source_url
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    source_url:
                      event.target.value,
                  })
                }
                placeholder="https://..."
              />
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent:
                'flex-end',
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              className="btn light"
              onClick={closeModal}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn primary"
              disabled={saving}
            >
              {saving
                ? 'Salvando...'
                : editing
                  ? 'Salvar alterações'
                  : 'Criar licitação'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

const metricCard = {
  background: '#fff',
  border: '1px solid #e0e4e7',
  borderRadius: 14,
  padding: '16px 18px',
};

const metricLabel = {
  display: 'block',
  color: '#747b7e',
  fontSize: 13,
  marginBottom: 5,
};

const metricNumber = {
  display: 'block',
  fontSize: 25,
  color: '#202b33',
};

const headerStyle = {
  padding: '16px 15px',
  textAlign: 'left' as const,
  color: '#53606b',
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
};

const cellStyle = {
  padding: '18px 15px',
  color: '#27313a',
  fontSize: 14,
  verticalAlign: 'top' as const,
};

const actionStyle = {
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  color: '#4b5563',
  fontSize: 14,
};
