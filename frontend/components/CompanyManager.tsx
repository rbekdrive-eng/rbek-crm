'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from '@/lib/api';
import Modal from './Modal';
import {
  Loading,
  ErrorBox,
  Empty,
} from './State';

type Company = {
  id: number;
  external_id?: string | null;
  legal_name?: string | null;
  trade_name: string;
  document?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  segment?: string | null;
  website?: string | null;
  priority: string;
  status: string;
  score: number;
  notes?: string | null;
  last_update?: string | null;
};

type CompanyForm = {
  trade_name: string;
  legal_name: string;
  country: string;
  state: string;
  city: string;
  segment: string;
  website: string;
  priority: string;
  status: string;
  score: number;
  notes: string;
};

const emptyForm: CompanyForm = {
  trade_name: '',
  legal_name: '',
  country: 'Brasil',
  state: '',
  city: '',
  segment: '',
  website: '',
  priority: 'Alta',
  status: 'Ativa',
  score: 70,
  notes: '',
};

const priorities = [
  'Alta',
  'Média',
  'Baixa',
];

const statuses = [
  'Ativa',
  'Prospect',
  'Cliente',
  'Inativa',
];

function extractList<T>(response: any): T[] {
  const data =
    response?.data?.data ??
    response?.data ??
    response ??
    [];

  return Array.isArray(data) ? data : [];
}

function priorityStyle(priority: string) {
  if (priority === 'Alta') {
    return {
      background: '#fff0cf',
      color: '#8a5a0e',
    };
  }

  if (priority === 'Média') {
    return {
      background: '#eef0f1',
      color: '#555a5c',
    };
  }

  return {
    background: '#f4f5f5',
    color: '#747b7e',
  };
}

function statusStyle(status: string) {
  if (status === 'Ativa') {
    return {
      background: '#e7f6eb',
      color: '#25733b',
    };
  }

  if (status === 'Cliente') {
    return {
      background: '#fff4df',
      color: '#936117',
    };
  }

  if (status === 'Prospect') {
    return {
      background: '#eef3f5',
      color: '#43565f',
    };
  }

  return {
    background: '#f1f3f4',
    color: '#737b80',
  };
}

function scoreStyle(score: number) {
  if (score >= 80) {
    return {
      background: '#fdb54a',
      color: '#3d4142',
    };
  }

  if (score >= 50) {
    return {
      background: '#d9dddf',
      color: '#3d4142',
    };
  }

  return {
    background: '#e9ebec',
    color: '#6d7479',
  };
}

export default function CompanyManager() {
  const [items, setItems] =
    useState<Company[]>([]);

  const [query, setQuery] =
    useState('');

  const [priorityFilter, setPriorityFilter] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    recalculating,
    setRecalculating,
  ] = useState(false);

  const [err, setErr] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<CompanyForm>(emptyForm);

  async function load() {
    try {
      setLoading(true);
      setErr('');

      const response = await api<any>(
        '/companies?per_page=300'
      );

      setItems(
        extractList<Company>(response)
      );
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível carregar as empresas.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const search =
      query.trim().toLowerCase();

    return items.filter((company) => {
      const matchesPriority =
        !priorityFilter ||
        company.priority ===
          priorityFilter;

      if (!matchesPriority) {
        return false;
      }

      if (!search) {
        return true;
      }

      const text = [
        company.trade_name,
        company.legal_name,
        company.city,
        company.state,
        company.country,
        company.segment,
        company.status,
        company.priority,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(search);
    });
  }, [
    items,
    query,
    priorityFilter,
  ]);

  const highPriorityCount =
    useMemo(
      () =>
        items.filter(
          (company) =>
            company.priority === 'Alta'
        ).length,
      [items]
    );

  const averageScore =
    useMemo(() => {
      if (!items.length) {
        return 0;
      }

      const total =
        items.reduce(
          (sum, company) =>
            sum +
            Number(company.score || 0),
          0
        );

      return Math.round(
        total / items.length
      );
    }, [items]);

  const paraguayCount =
    useMemo(() => {
      return items.filter(
        (company) => {
          const text = [
            company.country,
            company.state,
            company.city,
            company.notes,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return (
            text.includes(
              'paraguai'
            ) ||
            text.includes(
              'paraguay'
            )
          );
        }
      ).length;
    }, [items]);

  function newCompany() {
    setEditing(null);
    setForm(emptyForm);
    setErr('');
    setSuccess('');
    setOpen(true);
  }

  function editCompany(
    company: Company
  ) {
    setEditing(company.id);

    setForm({
      trade_name:
        company.trade_name || '',

      legal_name:
        company.legal_name || '',

      country:
        company.country || 'Brasil',

      state:
        company.state || '',

      city:
        company.city || '',

      segment:
        company.segment || '',

      website:
        company.website || '',

      priority:
        company.priority || 'Alta',

      status:
        company.status || 'Ativa',

      score:
        Number(company.score || 0),

      notes:
        company.notes || '',
    });

    setErr('');
    setSuccess('');
    setOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setErr('');
  }

  async function saveCompany(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.trade_name.trim()) {
      setErr(
        'Informe o nome fantasia da empresa.'
      );
      return;
    }

    try {
      setSaving(true);
      setErr('');
      setSuccess('');

      const payload = {
        trade_name:
          form.trade_name.trim(),

        legal_name:
          form.legal_name.trim() ||
          null,

        country:
          form.country.trim() ||
          null,

        state:
          form.state.trim() ||
          null,

        city:
          form.city.trim() ||
          null,

        segment:
          form.segment.trim() ||
          null,

        website:
          form.website.trim() ||
          null,

        priority:
          form.priority,

        status:
          form.status,

        score:
          Number(form.score),

        notes:
          form.notes.trim() ||
          null,

        last_update:
          new Date().toISOString(),
      };

      if (editing) {
        await api(
          `/companies/${editing}`,
          {
            method: 'PUT',
            body:
              JSON.stringify(
                payload
              ),
          }
        );
      } else {
        await api(
          '/companies',
          {
            method: 'POST',
            body:
              JSON.stringify(
                payload
              ),
          }
        );
      }

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível salvar a empresa.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCompany(
    company: Company
  ) {
    const confirmed =
      window.confirm(
        `Deseja realmente excluir a empresa "${company.trade_name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setErr('');
      setSuccess('');

      await api(
        `/companies/${company.id}`,
        {
          method: 'DELETE',
        }
      );

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível excluir a empresa.'
      );
    }
  }

  async function recalculateAllScores() {
    const confirmed =
      window.confirm(
        'Recalcular o score e a prioridade de todas as empresas usando as evidências, oportunidades, obras, contatos, atividades e sinais do Paraguai?'
      );

    if (!confirmed) {
      return;
    }

    try {
      setRecalculating(true);
      setErr('');
      setSuccess('');

      const response =
        await api<any>(
          '/companies/recalculate-scores',
          {
            method: 'POST',
          }
        );

      const updated =
        Number(
          response?.updated || 0
        );

      setSuccess(
        updated > 0
          ? `Inteligência recalculada com sucesso para ${updated} empresas.`
          : 'Inteligência recalculada com sucesso.'
      );

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível recalcular os scores.'
      );
    } finally {
      setRecalculating(false);
    }
  }

  async function recalculateCompany(
    company: Company
  ) {
    try {
      setErr('');
      setSuccess('');

      await api(
        `/companies/${company.id}/recalculate-score`,
        {
          method: 'POST',
        }
      );

      setSuccess(
        `Score de ${company.trade_name} recalculado.`
      );

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível recalcular esta empresa.'
      );
    }
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems:
            'flex-start',
          justifyContent:
            'space-between',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing:
                '0.12em',
              color: '#c78310',
              marginBottom: 8,
            }}
          >
            RADAR COMERCIAL
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.15,
              color: '#202b33',
            }}
          >
            Empresas
          </h1>

          <p
            style={{
              margin:
                '10px 0 0',
              fontSize: 18,
              color: '#6d7479',
            }}
          >
            Base corporativa,
            classificação e
            inteligência de
            prospecção.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            gap: 12,
          }}
        >
          <button
            type="button"
            className="btn light"
            onClick={() =>
              void recalculateAllScores()
            }
            disabled={
              recalculating ||
              loading
            }
            style={{
              minHeight: 48,
              paddingLeft: 18,
              paddingRight: 18,
            }}
          >
            {recalculating
              ? 'Recalculando...'
              : '↻ Recalcular inteligência'}
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={newCompany}
            style={{
              minHeight: 48,
              paddingLeft: 22,
              paddingRight: 22,
            }}
          >
            + Nova empresa
          </button>
        </div>
      </div>

      {success ? (
        <div
          style={{
            marginBottom: 18,
            padding:
              '12px 16px',
            background:
              '#e7f6eb',
            border:
              '1px solid #ccebd4',
            borderRadius: 10,
            color: '#25733b',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {success}
        </div>
      ) : null}

      {err && !open ? (
        <ErrorBox
          message={err}
        />
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: 16,
          maxWidth: 980,
          marginBottom: 22,
        }}
      >
        <div style={metricCard}>
          <span
            style={metricLabel}
          >
            Empresas monitoradas
          </span>

          <strong
            style={metricNumber}
          >
            {items.length}
          </strong>
        </div>

        <div style={metricCard}>
          <span
            style={metricLabel}
          >
            Prioridade alta
          </span>

          <strong
            style={metricNumber}
          >
            {highPriorityCount}
          </strong>
        </div>

        <div style={metricCard}>
          <span
            style={metricLabel}
          >
            Score médio
          </span>

          <strong
            style={metricNumber}
          >
            {averageScore}
          </strong>
        </div>

        <div style={metricCard}>
          <span
            style={metricLabel}
          >
            Paraguai
          </span>

          <strong
            style={metricNumber}
          >
            {paraguayCount}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'space-between',
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            width: '100%',
            maxWidth: 720,
          }}
        >
          <input
            type="search"
            placeholder="Buscar empresa, cidade ou segmento..."
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            style={{
              width: '100%',
              minHeight: 48,
              padding: '0 16px',
              border:
                '1px solid #d9dee2',
              borderRadius: 12,
              background: '#fff',
              fontSize: 16,
              outline: 'none',
            }}
          />

          <select
            value={
              priorityFilter
            }
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
            style={{
              minWidth: 190,
              minHeight: 48,
              padding: '0 14px',
              border:
                '1px solid #d9dee2',
              borderRadius: 12,
              background: '#fff',
              fontSize: 15,
            }}
          >
            <option value="">
              Todas as prioridades
            </option>

            {priorities.map(
              (priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              )
            )}
          </select>
        </div>

        <span
          style={{
            color: '#737b80',
            fontSize: 14,
            whiteSpace:
              'nowrap',
          }}
        >
          {filtered.length}{' '}
          {filtered.length === 1
            ? 'empresa'
            : 'empresas'}
        </span>
      </div>

      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="Nenhuma empresa encontrada." />
      ) : (
        <div
          style={{
            background: '#fff',
            border:
              '1px solid #e0e4e7',
            borderRadius: 18,
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: 1180,
              borderCollapse:
                'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom:
                    '1px solid #e4e7e9',
                }}
              >
                <th
                  style={headerStyle}
                >
                  EMPRESA
                </th>

                <th
                  style={headerStyle}
                >
                  LOCALIZAÇÃO
                </th>

                <th
                  style={headerStyle}
                >
                  SEGMENTO
                </th>

                <th
                  style={headerStyle}
                >
                  PRIORIDADE
                </th>

                <th
                  style={headerStyle}
                >
                  SCORE
                </th>

                <th
                  style={headerStyle}
                >
                  STATUS
                </th>

                <th
                  style={headerStyle}
                >
                  AÇÕES
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(
                (company) => {
                  const priorityBadge =
                    priorityStyle(
                      company.priority
                    );

                  const statusBadge =
                    statusStyle(
                      company.status
                    );

                  const scoreBadge =
                    scoreStyle(
                      Number(
                        company.score ||
                          0
                      )
                    );

                  return (
                    <tr
                      key={
                        company.id
                      }
                      style={{
                        borderBottom:
                          '1px solid #edf0f2',
                      }}
                    >
                      <td
                        style={
                          cellStyle
                        }
                      >
                        <strong
                          style={{
                            display:
                              'block',
                            color:
                              '#202b33',
                            marginBottom:
                              4,
                          }}
                        >
                          {
                            company.trade_name
                          }
                        </strong>

                        <span
                          style={{
                            color:
                              '#8a9297',
                            fontSize: 12,
                          }}
                        >
                          {company.legal_name ||
                            '—'}
                        </span>
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        {[
                          company.city,
                          company.state,
                          company.country,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            ' · '
                          ) || '—'}
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        {company.segment ||
                          '—'}
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <span
                          style={{
                            display:
                              'inline-flex',
                            padding:
                              '6px 10px',
                            borderRadius:
                              999,
                            fontSize: 12,
                            fontWeight:
                              700,
                            ...priorityBadge,
                          }}
                        >
                          {
                            company.priority
                          }
                        </span>
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 10,
                            minWidth:
                              115,
                          }}
                        >
                          <span
                            style={{
                              display:
                                'inline-flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center',
                              width: 36,
                              height: 28,
                              borderRadius:
                                8,
                              fontSize: 13,
                              fontWeight:
                                800,
                              ...scoreBadge,
                            }}
                          >
                            {Number(
                              company.score ||
                                0
                            )}
                          </span>

                          <div
                            style={{
                              width: 58,
                              height: 6,
                              borderRadius:
                                999,
                              background:
                                '#eceeef',
                              overflow:
                                'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    Number(
                                      company.score ||
                                        0
                                    )
                                  )
                                )}%`,
                                height:
                                  '100%',
                                borderRadius:
                                  999,
                                background:
                                  '#fdb54a',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <span
                          style={{
                            display:
                              'inline-flex',
                            padding:
                              '6px 10px',
                            borderRadius:
                              999,
                            fontSize: 12,
                            fontWeight:
                              700,
                            ...statusBadge,
                          }}
                        >
                          {
                            company.status
                          }
                        </span>
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 13,
                            whiteSpace:
                              'nowrap',
                          }}
                        >
                          <button
                            type="button"
                            title="Recalcular score desta empresa"
                            onClick={() =>
                              void recalculateCompany(
                                company
                              )
                            }
                            style={
                              actionStyle
                            }
                          >
                            ↻ Score
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editCompany(
                                company
                              )
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
                              void deleteCompany(
                                company
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
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        title={
          editing
            ? 'Editar empresa'
            : 'Nova empresa'
        }
        onClose={closeModal}
      >
        <form
          onSubmit={saveCompany}
        >
          {err && open ? (
            <div
              style={{
                marginBottom: 16,
              }}
            >
              <ErrorBox
                message={err}
              />
            </div>
          ) : null}

          <div className="form-grid">
            <label className="full">
              Nome fantasia

              <input
                type="text"
                value={
                  form.trade_name
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    trade_name:
                      event.target
                        .value,
                  })
                }
                required
              />
            </label>

            <label className="full">
              Razão social

              <input
                type="text"
                value={
                  form.legal_name
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    legal_name:
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              País

              <input
                type="text"
                value={
                  form.country
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    country:
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              UF / Departamento

              <input
                type="text"
                value={form.state}
                onChange={(event) =>
                  setForm({
                    ...form,
                    state:
                      event.target
                        .value,
                  })
                }
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
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Segmento

              <input
                type="text"
                value={
                  form.segment
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    segment:
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <label className="full">
              Website

              <input
                type="text"
                value={
                  form.website
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    website:
                      event.target
                        .value,
                  })
                }
                placeholder="https://..."
              />
            </label>

            <label>
              Prioridade

              <select
                value={
                  form.priority
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority:
                      event.target
                        .value,
                  })
                }
              >
                {priorities.map(
                  (priority) => (
                    <option
                      key={
                        priority
                      }
                      value={
                        priority
                      }
                    >
                      {
                        priority
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Status

              <select
                value={
                  form.status
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    status:
                      event.target
                        .value,
                  })
                }
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
              Score atual

              <input
                type="number"
                min="0"
                max="100"
                value={
                  form.score
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    score:
                      Number(
                        event.target
                          .value
                      ),
                  })
                }
              />

              <small
                style={{
                  color: '#7d858a',
                  marginTop: 5,
                }}
              >
                O score pode ser recalculado automaticamente pelo motor de inteligência R.BEK.
              </small>
            </label>

            <label className="full">
              Observações

              <textarea
                rows={4}
                value={
                  form.notes
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    notes:
                      event.target
                        .value,
                  })
                }
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
              onClick={
                closeModal
              }
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
                  : 'Criar empresa'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

const metricCard = {
  background: '#fff',
  border:
    '1px solid #e0e4e7',
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
  textAlign:
    'left' as const,
  color: '#53606b',
  fontSize: 12,
  fontWeight: 700,
  whiteSpace:
    'nowrap' as const,
};

const cellStyle = {
  padding: '18px 15px',
  color: '#27313a',
  fontSize: 14,
  verticalAlign:
    'middle' as const,
};

const actionStyle = {
  padding: 0,
  border: 0,
  background:
    'transparent',
  cursor: 'pointer',
  color: '#4b5563',
  fontSize: 13,
};
