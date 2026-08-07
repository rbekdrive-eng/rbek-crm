'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import Modal from './Modal';
import { Loading, ErrorBox, Empty } from './State';

type Company = {
  id: number;
  trade_name?: string | null;
  legal_name?: string | null;
};

type Opportunity = {
  id: number;
  title: string;
  company_id?: number | null;
  company?: Company | null;
};

type Evidence = {
  id: number;
  company_id?: number | null;
  opportunity_id?: number | null;
  external_id?: string | null;
  source_type?: string | null;
  title: string;
  description?: string | null;
  published_at?: string | null;
  url?: string | null;
  confidence?: number | null;
  score_impact?: number | null;
  company?: Company | null;
  opportunity?: Opportunity | null;
};

type EvidenceForm = {
  company_id: number | '';
  opportunity_id: number | '';
  external_id: string;
  source_type: string;
  title: string;
  description: string;
  published_at: string;
  url: string;
  confidence: number;
  score_impact: number;
};

const sourceTypes = [
  'Site oficial',
  'Notícia',
  'LinkedIn',
  'Instagram',
  'Evento',
  'Vaga',
  'Licitação',
  'Diário Oficial',
  'Governo',
  'Associação',
  'Relatório',
  'Outro',
];

const emptyForm: EvidenceForm = {
  company_id: '',
  opportunity_id: '',
  external_id: '',
  source_type: 'Notícia',
  title: '',
  description: '',
  published_at: '',
  url: '',
  confidence: 70,
  score_impact: 0,
};

function extractList<T>(response: any): T[] {
  const data =
    response?.data?.data ??
    response?.data ??
    response ??
    [];

  return Array.isArray(data) ? data : [];
}

function companyName(company?: Company | null) {
  if (!company) return '—';

  return company.trade_name || company.legal_name || '—';
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

function confidenceStyle(value?: number | null) {
  const number = Number(value || 0);

  if (number >= 80) {
    return {
      background: '#e7f6eb',
      color: '#25733b',
    };
  }

  if (number >= 60) {
    return {
      background: '#fff4df',
      color: '#936117',
    };
  }

  return {
    background: '#f1f3f4',
    color: '#6d7479',
  };
}

function impactStyle(value?: number | null) {
  const number = Number(value || 0);

  if (number > 0) {
    return {
      background: '#e7f6eb',
      color: '#25733b',
    };
  }

  if (number < 0) {
    return {
      background: '#f7ecec',
      color: '#914848',
    };
  }

  return {
    background: '#eef0f1',
    color: '#555a5c',
  };
}

export default function EvidenceManager() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<EvidenceForm>(emptyForm);

  async function load() {
    try {
      setLoading(true);
      setErr('');

      const [
        evidencesResponse,
        companiesResponse,
        opportunitiesResponse,
      ] = await Promise.all([
        api<any>('/evidences?per_page=300'),
        api<any>('/companies?per_page=300'),
        api<any>('/opportunities?per_page=300'),
      ]);

      setItems(extractList<Evidence>(evidencesResponse));
      setCompanies(extractList<Company>(companiesResponse));
      setOpportunities(extractList<Opportunity>(opportunitiesResponse));
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível carregar as evidências.'
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

    return items.filter((evidence) => {
      const matchesSource =
        !sourceFilter ||
        evidence.source_type === sourceFilter;

      if (!matchesSource) {
        return false;
      }

      if (!search) {
        return true;
      }

      const content = [
        evidence.title,
        evidence.source_type,
        evidence.description,
        evidence.external_id,
        companyName(evidence.company),
        evidence.opportunity?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return content.includes(search);
    });
  }, [items, query, sourceFilter]);

  const averageConfidence = useMemo(() => {
    if (!items.length) return 0;

    const total = items.reduce(
      (sum, item) => sum + Number(item.confidence || 0),
      0
    );

    return Math.round(total / items.length);
  }, [items]);

  const positiveImpactCount = useMemo(() => {
    return items.filter(
      (item) => Number(item.score_impact || 0) > 0
    ).length;
  }, [items]);

  const highConfidenceCount = useMemo(() => {
    return items.filter(
      (item) => Number(item.confidence || 0) >= 80
    ).length;
  }, [items]);

  const availableOpportunities = useMemo(() => {
    if (!form.company_id) {
      return opportunities;
    }

    return opportunities.filter(
      (opportunity) =>
        Number(opportunity.company_id) === Number(form.company_id) ||
        Number(opportunity.company?.id) === Number(form.company_id)
    );
  }, [opportunities, form.company_id]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErr('');
    setOpen(true);
  }

  function openEdit(evidence: Evidence) {
    setEditing(evidence.id);

    setForm({
      company_id: evidence.company_id || '',
      opportunity_id: evidence.opportunity_id || '',
      external_id: evidence.external_id || '',
      source_type: evidence.source_type || 'Notícia',
      title: evidence.title || '',
      description: evidence.description || '',
      published_at: dateOnly(evidence.published_at),
      url: evidence.url || '',
      confidence: Number(evidence.confidence || 0),
      score_impact: Number(evidence.score_impact || 0),
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

  async function saveEvidence(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.title.trim()) {
      setErr('Informe o título da evidência.');
      return;
    }

    try {
      setSaving(true);
      setErr('');

      const payload = {
        company_id: form.company_id
          ? Number(form.company_id)
          : null,

        opportunity_id: form.opportunity_id
          ? Number(form.opportunity_id)
          : null,

        external_id:
          form.external_id.trim() || null,

        source_type:
          form.source_type.trim() || null,

        title:
          form.title.trim(),

        description:
          form.description.trim() || null,

        published_at:
          form.published_at || null,

        url:
          form.url.trim() || null,

        confidence:
          Number(form.confidence),

        score_impact:
          Number(form.score_impact),
      };

      if (editing) {
        await api(`/evidences/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/evidences', {
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
          'Não foi possível salvar a evidência.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvidence(evidence: Evidence) {
    const confirmed = window.confirm(
      `Deseja realmente excluir a evidência "${evidence.title}"?`
    );

    if (!confirmed) return;

    try {
      setErr('');

      await api(`/evidences/${evidence.id}`, {
        method: 'DELETE',
      });

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível excluir a evidência.'
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
            INTELIGÊNCIA COMERCIAL
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.15,
              color: '#202b33',
            }}
          >
            Evidências
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 18,
              color: '#6d7479',
            }}
          >
            Fontes públicas que sustentam a inteligência comercial.
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
          + Nova evidência
        </button>
      </div>

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
          <span style={metricLabel}>
            Evidências
          </span>

          <strong style={metricNumber}>
            {items.length}
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Alta confiança
          </span>

          <strong style={metricNumber}>
            {highConfidenceCount}
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Confiança média
          </span>

          <strong style={metricNumber}>
            {averageConfidence}%
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Impacto positivo
          </span>

          <strong style={metricNumber}>
            {positiveImpactCount}
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
            placeholder="Buscar título, empresa, fonte ou oportunidade..."
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
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(event.target.value)
            }
            style={{
              minWidth: 190,
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
              Todas as fontes
            </option>

            {sourceTypes.map((source) => (
              <option
                key={source}
                value={source}
              >
                {source}
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
            ? 'evidência'
            : 'evidências'}
        </span>
      </div>

      {err && !open ? (
        <ErrorBox message={err} />
      ) : null}

      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="Nenhuma evidência encontrada." />
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
              minWidth: 1220,
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
                  EVIDÊNCIA
                </th>

                <th style={headerStyle}>
                  EMPRESA
                </th>

                <th style={headerStyle}>
                  OPORTUNIDADE
                </th>

                <th style={headerStyle}>
                  FONTE
                </th>

                <th style={headerStyle}>
                  PUBLICAÇÃO
                </th>

                <th style={headerStyle}>
                  CONFIANÇA
                </th>

                <th style={headerStyle}>
                  IMPACTO
                </th>

                <th style={headerStyle}>
                  LINK
                </th>

                <th style={headerStyle}>
                  AÇÕES
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((evidence) => {
                const confidenceBadge =
                  confidenceStyle(
                    evidence.confidence
                  );

                const impactBadge =
                  impactStyle(
                    evidence.score_impact
                  );

                return (
                  <tr
                    key={evidence.id}
                    style={{
                      borderBottom:
                        '1px solid #eef0f2',
                    }}
                  >
                    <td
                      style={{
                        ...cellStyle,
                        maxWidth: 330,
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          marginBottom: 5,
                        }}
                      >
                        {evidence.title}
                      </strong>

                      {evidence.description ? (
                        <div
                          style={{
                            color: '#7b838b',
                            fontSize: 12,
                            lineHeight: 1.4,
                          }}
                        >
                          {evidence.description.length > 120
                            ? `${evidence.description.slice(0, 120)}...`
                            : evidence.description}
                        </div>
                      ) : null}
                    </td>

                    <td style={cellStyle}>
                      {companyName(
                        evidence.company
                      )}
                    </td>

                    <td style={cellStyle}>
                      {evidence.opportunity?.title ||
                        '—'}
                    </td>

                    <td style={cellStyle}>
                      {evidence.source_type ||
                        '—'}
                    </td>

                    <td style={cellStyle}>
                      {formatDate(
                        evidence.published_at
                      )}
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
                          ...confidenceBadge,
                        }}
                      >
                        {Number(
                          evidence.confidence || 0
                        )}
                        %
                      </span>
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
                          ...impactBadge,
                        }}
                      >
                        {Number(
                          evidence.score_impact || 0
                        ) > 0
                          ? '+'
                          : ''}
                        {Number(
                          evidence.score_impact || 0
                        )}
                      </span>
                    </td>

                    <td style={cellStyle}>
                      {evidence.url ? (
                        <a
                          href={evidence.url}
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
                            openEdit(evidence)
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
                            void deleteEvidence(
                              evidence
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
            ? 'Editar evidência'
            : 'Nova evidência'
        }
        onClose={closeModal}
      >
        <form onSubmit={saveEvidence}>
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
              Empresa

              <select
                value={form.company_id}
                onChange={(event) => {
                  const companyId =
                    event.target.value
                      ? Number(event.target.value)
                      : '';

                  setForm({
                    ...form,
                    company_id: companyId,
                    opportunity_id: '',
                  });
                }}
              >
                <option value="">
                  Sem empresa vinculada
                </option>

                {companies.map(
                  (company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {companyName(
                        company
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="full">
              Oportunidade

              <select
                value={
                  form.opportunity_id
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    opportunity_id:
                      event.target.value
                        ? Number(
                            event.target.value
                          )
                        : '',
                  })
                }
              >
                <option value="">
                  Sem oportunidade vinculada
                </option>

                {availableOpportunities.map(
                  (opportunity) => (
                    <option
                      key={opportunity.id}
                      value={opportunity.id}
                    >
                      {opportunity.title}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Tipo da fonte

              <select
                value={
                  form.source_type
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    source_type:
                      event.target.value,
                  })
                }
              >
                {sourceTypes.map(
                  (source) => (
                    <option
                      key={source}
                      value={source}
                    >
                      {source}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Código externo

              <input
                type="text"
                value={
                  form.external_id
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    external_id:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              Título

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title:
                      event.target.value,
                  })
                }
                required
              />
            </label>

            <label className="full">
              Descrição

              <textarea
                rows={4}
                value={
                  form.description
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Descreva o sinal identificado e por que ele é relevante..."
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
              Confiança (%)

              <input
                type="number"
                min="0"
                max="100"
                value={
                  form.confidence
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    confidence:
                      Number(
                        event.target.value
                      ),
                  })
                }
              />
            </label>

            <label>
              Impacto no score

              <input
                type="number"
                min="-100"
                max="100"
                value={
                  form.score_impact
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    score_impact:
                      Number(
                        event.target.value
                      ),
                  })
                }
              />
            </label>

            <label className="full">
              URL da fonte

              <input
                type="text"
                value={form.url}
                onChange={(event) =>
                  setForm({
                    ...form,
                    url:
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
                  : 'Criar evidência'}
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
