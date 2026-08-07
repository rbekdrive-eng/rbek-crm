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

type Work = {
  id: number;
  company_id?: number | null;
  external_id?: string | null;
  name: string;
  type?: string | null;
  contractor?: string | null;
  city?: string | null;
  state_country?: string | null;
  contract_value?: string | number | null;
  status?: string | null;
  potential?: string | null;
  notes?: string | null;
  company?: Company | null;
};

type WorkForm = {
  company_id: number | '';
  external_id: string;
  name: string;
  type: string;
  contractor: string;
  city: string;
  state_country: string;
  contract_value: string;
  status: string;
  potential: string;
  notes: string;
};

const statuses = [
  'Monitoramento',
  'Planejamento',
  'Licitação',
  'Contratação',
  'Em andamento',
  'Paralisada',
  'Concluída',
];

const potentials = [
  'Baixo',
  'Médio',
  'Alto',
  'Estratégico',
];

const emptyForm: WorkForm = {
  company_id: '',
  external_id: '',
  name: '',
  type: '',
  contractor: '',
  city: '',
  state_country: '',
  contract_value: '',
  status: 'Monitoramento',
  potential: 'Médio',
  notes: '',
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

function statusStyle(status?: string | null) {
  if (status === 'Concluída') {
    return {
      background: '#e7f6eb',
      color: '#25733b',
    };
  }

  if (status === 'Em andamento') {
    return {
      background: '#fff4df',
      color: '#936117',
    };
  }

  if (status === 'Paralisada') {
    return {
      background: '#f7ecec',
      color: '#914848',
    };
  }

  if (status === 'Licitação') {
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

function potentialStyle(potential?: string | null) {
  if (potential === 'Estratégico') {
    return {
      background: '#fff0cf',
      color: '#8a5a0e',
    };
  }

  if (potential === 'Alto') {
    return {
      background: '#fff4df',
      color: '#936117',
    };
  }

  if (potential === 'Médio') {
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

export default function WorkManager() {
  const [items, setItems] = useState<Work[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<WorkForm>(emptyForm);

  async function load() {
    try {
      setLoading(true);
      setErr('');

      const [worksResponse, companiesResponse] =
        await Promise.all([
          api<any>('/works?per_page=300'),
          api<any>('/companies?per_page=300'),
        ]);

      setItems(extractList<Work>(worksResponse));
      setCompanies(
        extractList<Company>(companiesResponse)
      );
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível carregar as obras.'
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

    return items.filter((work) => {
      const matchesStatus =
        !statusFilter ||
        work.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!search) {
        return true;
      }

      const content = [
        work.name,
        work.external_id,
        work.type,
        work.contractor,
        work.city,
        work.state_country,
        work.status,
        work.potential,
        work.notes,
        companyName(work.company),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return content.includes(search);
    });
  }, [items, query, statusFilter]);

  const totalValue = useMemo(() => {
    return items.reduce(
      (total, work) =>
        total + Number(work.contract_value || 0),
      0
    );
  }, [items]);

  const strategicCount = useMemo(() => {
    return items.filter(
      (work) =>
        work.potential === 'Alto' ||
        work.potential === 'Estratégico'
    ).length;
  }, [items]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErr('');
    setOpen(true);
  }

  function openEdit(work: Work) {
    setEditing(work.id);

    setForm({
      company_id: work.company_id || '',
      external_id: work.external_id || '',
      name: work.name || '',
      type: work.type || '',
      contractor: work.contractor || '',
      city: work.city || '',
      state_country: work.state_country || '',
      contract_value:
        work.contract_value !== null &&
        work.contract_value !== undefined
          ? String(work.contract_value)
          : '',
      status:
        work.status || 'Monitoramento',
      potential:
        work.potential || 'Médio',
      notes: work.notes || '',
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

  async function saveWork(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setErr('Informe o nome da obra.');
      return;
    }

    try {
      setSaving(true);
      setErr('');

      const payload = {
        company_id: form.company_id
          ? Number(form.company_id)
          : null,

        external_id:
          form.external_id.trim() || null,

        name: form.name.trim(),

        type:
          form.type.trim() || null,

        contractor:
          form.contractor.trim() || null,

        city:
          form.city.trim() || null,

        state_country:
          form.state_country.trim() || null,

        contract_value:
          form.contract_value !== ''
            ? Number(
                form.contract_value.replace(
                  ',',
                  '.'
                )
              )
            : null,

        status:
          form.status || null,

        potential:
          form.potential || null,

        notes:
          form.notes.trim() || null,
      };

      if (editing) {
        await api(`/works/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/works', {
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
          'Não foi possível salvar a obra.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteWork(work: Work) {
    const confirmed = window.confirm(
      `Deseja realmente excluir a obra "${work.name}"?`
    );

    if (!confirmed) return;

    try {
      setErr('');

      await api(`/works/${work.id}`, {
        method: 'DELETE',
      });

      await load();
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível excluir a obra.'
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
            ENGENHARIA E INFRAESTRUTURA
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.15,
              color: '#202b33',
            }}
          >
            Obras e projetos
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 18,
              color: '#6d7479',
            }}
          >
            Projetos de engenharia e infraestrutura monitorados.
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
          + Nova obra
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, minmax(0, 1fr))',
          gap: 16,
          maxWidth: 820,
          marginBottom: 22,
        }}
      >
        <div style={metricCard}>
          <span style={metricLabel}>
            Obras monitoradas
          </span>

          <strong style={metricNumber}>
            {items.length}
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Alto potencial
          </span>

          <strong style={metricNumber}>
            {strategicCount}
          </strong>
        </div>

        <div style={metricCard}>
          <span style={metricLabel}>
            Valor monitorado
          </span>

          <strong
            style={{
              ...metricNumber,
              fontSize: 21,
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
            placeholder="Buscar obra, empresa, cidade ou construtora..."
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
            ? 'obra'
            : 'obras'}
        </span>
      </div>

      {err && !open ? (
        <ErrorBox message={err} />
      ) : null}

      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="Nenhuma obra encontrada." />
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
              minWidth: 1150,
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
                  OBRA
                </th>

                <th style={headerStyle}>
                  EMPRESA
                </th>

                <th style={headerStyle}>
                  TIPO
                </th>

                <th style={headerStyle}>
                  LOCALIZAÇÃO
                </th>

                <th style={headerStyle}>
                  STATUS
                </th>

                <th style={headerStyle}>
                  POTENCIAL
                </th>

                <th style={headerStyle}>
                  VALOR
                </th>

                <th style={headerStyle}>
                  AÇÕES
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((work) => {
                const statusBadge =
                  statusStyle(work.status);

                const potentialBadge =
                  potentialStyle(
                    work.potential
                  );

                return (
                  <tr
                    key={work.id}
                    style={{
                      borderBottom:
                        '1px solid #eef0f2',
                    }}
                  >
                    <td style={cellStyle}>
                      <strong>
                        {work.name}
                      </strong>

                      {work.external_id ? (
                        <div
                          style={{
                            marginTop: 4,
                            color: '#7b838b',
                            fontSize: 12,
                          }}
                        >
                          {work.external_id}
                        </div>
                      ) : null}
                    </td>

                    <td style={cellStyle}>
                      {companyName(
                        work.company
                      )}
                    </td>

                    <td style={cellStyle}>
                      {work.type || '—'}
                    </td>

                    <td style={cellStyle}>
                      {[
                        work.city,
                        work.state_country,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
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
                          ...statusBadge,
                        }}
                      >
                        {work.status || '—'}
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
                          ...potentialBadge,
                        }}
                      >
                        {work.potential ||
                          '—'}
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
                        work.contract_value
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
                            openEdit(work)
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
                            void deleteWork(
                              work
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
            ? 'Editar obra'
            : 'Nova obra'
        }
        onClose={closeModal}
      >
        <form onSubmit={saveWork}>
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
              Empresa vinculada

              <select
                value={form.company_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    company_id:
                      event.target.value
                        ? Number(
                            event.target
                              .value
                          )
                        : '',
                  })
                }
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
              Nome da obra

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target
                      .value,
                  })
                }
                required
              />
            </label>

            <label>
              Código / referência

              <input
                type="text"
                value={
                  form.external_id
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    external_id:
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Tipo

              <input
                type="text"
                value={form.type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    type: event.target
                      .value,
                  })
                }
                placeholder="Ex.: Obra rodoviária"
              />
            </label>

            <label className="full">
              Contratante / construtora

              <input
                type="text"
                value={form.contractor}
                onChange={(event) =>
                  setForm({
                    ...form,
                    contractor:
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
                    city: event.target
                      .value,
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
                      event.target
                        .value,
                  })
                }
                placeholder="Ex.: PR / Brasil"
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

            <label>
              Potencial comercial

              <select
                value={form.potential}
                onChange={(event) =>
                  setForm({
                    ...form,
                    potential:
                      event.target
                        .value,
                  })
                }
              >
                {potentials.map(
                  (potential) => (
                    <option
                      key={potential}
                      value={potential}
                    >
                      {potential}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="full">
              Valor do contrato

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.contract_value
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    contract_value:
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <label className="full">
              Observações

              <textarea
                rows={4}
                value={form.notes}
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
                  : 'Criar obra'}
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
