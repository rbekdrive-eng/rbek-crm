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
  company_id: string;
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

const emptyForm: WorkForm = {
  company_id: '',
  external_id: '',
  name: '',
  type: '',
  contractor: '',
  city: '',
  state_country: '',
  contract_value: '',
  status: '',
  potential: '',
  notes: '',
};

function getList<T>(response: any): T[] {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function companyName(company?: Company | null) {
  return company?.trade_name || company?.legal_name || '—';
}

function formatMoney(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
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

export default function WorkManager() {
  const [works, setWorks] = useState<Work[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Work | null>(null);
  const [form, setForm] = useState<WorkForm>(emptyForm);

  async function loadWorks() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/works');
      setWorks(getList<Work>(response));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Não foi possível carregar as obras.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    try {
      const response = await api.get('/companies');
      setCompanies(getList<Company>(response));
    } catch {
      setCompanies([]);
    }
  }

  useEffect(() => {
    void loadWorks();
    void loadCompanies();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return works;
    }

    return works.filter((work) => {
      const content = [
        work.name,
        work.external_id,
        work.type,
        work.contractor,
        work.city,
        work.state_country,
        work.status,
        work.potential,
        companyName(work.company),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return content.includes(term);
    });
  }, [works, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(work: Work) {
    setEditing(work);

    setForm({
      company_id: work.company_id ? String(work.company_id) : '',
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
      status: work.status || '',
      potential: work.potential || '',
      notes: work.notes || '',
    });

    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function updateField<K extends keyof WorkForm>(
    field: K,
    value: WorkForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Informe o nome da obra.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      company_id: form.company_id ? Number(form.company_id) : null,
      external_id: form.external_id.trim() || null,
      name: form.name.trim(),
      type: form.type.trim() || null,
      contractor: form.contractor.trim() || null,
      city: form.city.trim() || null,
      state_country: form.state_country.trim() || null,
      contract_value: form.contract_value
        ? Number(form.contract_value.replace(',', '.'))
        : null,
      status: form.status.trim() || null,
      potential: form.potential.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      if (editing) {
        await api.put(`/works/${editing.id}`, payload);
      } else {
        await api.post('/works', payload);
      }

      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);

      await loadWorks();
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .find(Boolean);

        if (firstError) {
          setError(String(firstError));
        } else {
          setError('Não foi possível salvar a obra.');
        }
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Não foi possível salvar a obra.'
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(work: Work) {
    const confirmed = window.confirm(
      `Deseja realmente excluir a obra "${work.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await api.delete(`/works/${work.id}`);
      await loadWorks();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Não foi possível excluir a obra.'
      );
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">INTELIGÊNCIA COMERCIAL</div>

          <h1>Obras e projetos</h1>

          <p>
            Projetos de engenharia e infraestrutura monitorados.
          </p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={openCreate}
        >
          + Nova obra
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar obra, empresa, cidade, tipo..."
          style={{
            width: '100%',
            maxWidth: 520,
            minHeight: 48,
            padding: '0 16px',
            border: '1px solid #d9dee3',
            borderRadius: 10,
            background: '#fff',
            fontSize: 16,
            outline: 'none',
          }}
        />

        <span
          style={{
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}
        >
          {filtered.length}{' '}
          {filtered.length === 1 ? 'obra' : 'obras'}
        </span>
      </div>

      {error && !modalOpen ? (
        <ErrorBox message={error} />
      ) : null}

      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="Nenhuma obra encontrada." />
      ) : (
        <div
          style={{
            background: '#fff',
            border: '1px solid #dde2e6',
            borderRadius: 18,
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 1050,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <th style={headerStyle}>OBRA</th>
                <th style={headerStyle}>EMPRESA</th>
                <th style={headerStyle}>TIPO</th>
                <th style={headerStyle}>CONTRATANTE</th>
                <th style={headerStyle}>LOCAL</th>
                <th style={headerStyle}>VALOR</th>
                <th style={headerStyle}>STATUS</th>
                <th style={headerStyle}>POTENCIAL</th>
                <th style={headerStyle}>AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((work) => (
                <tr
                  key={work.id}
                  style={{
                    borderBottom: '1px solid #eef0f2',
                  }}
                >
                  <td style={cellStyle}>
                    <strong>{work.name}</strong>

                    {work.external_id ? (
                      <div
                        style={{
                          marginTop: 4,
                          color: '#7b838b',
                          fontSize: 13,
                        }}
                      >
                        {work.external_id}
                      </div>
                    ) : null}
                  </td>

                  <td style={cellStyle}>
                    {companyName(work.company)}
                  </td>

                  <td style={cellStyle}>
                    {work.type || '—'}
                  </td>

                  <td style={cellStyle}>
                    {work.contractor || '—'}
                  </td>

                  <td style={cellStyle}>
                    {[work.city, work.state_country]
                      .filter(Boolean)
                      .join(' / ') || '—'}
                  </td>

                  <td style={cellStyle}>
                    {formatMoney(work.contract_value)}
                  </td>

                  <td style={cellStyle}>
                    {work.status || '—'}
                  </td>

                  <td style={cellStyle}>
                    {work.potential || '—'}
                  </td>

                  <td style={cellStyle}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(work)}
                        style={actionStyle}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(work)}
                        style={actionStyle}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar obra' : 'Nova obra'}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit}>
          {error && modalOpen ? (
            <div style={{ marginBottom: 16 }}>
              <ErrorBox message={error} />
            </div>
          ) : null}

          <div style={formGridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Nome da obra *</span>

              <input
                value={form.name}
                onChange={(event) =>
                  updateField('name', event.target.value)
                }
                required
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Empresa</span>

              <select
                value={form.company_id}
                onChange={(event) =>
                  updateField('company_id', event.target.value)
                }
                style={inputStyle}
              >
                <option value="">Sem empresa vinculada</option>

                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {companyName(company)}
                  </option>
                ))}
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Código externo</span>

              <input
                value={form.external_id}
                onChange={(event) =>
                  updateField('external_id', event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Tipo</span>

              <input
                value={form.type}
                onChange={(event) =>
                  updateField('type', event.target.value)
                }
                placeholder="Ex.: Rodovia, indústria, ponte..."
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Contratante</span>

              <input
                value={form.contractor}
                onChange={(event) =>
                  updateField('contractor', event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Cidade</span>

              <input
                value={form.city}
                onChange={(event) =>
                  updateField('city', event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Estado / País</span>

              <input
                value={form.state_country}
                onChange={(event) =>
                  updateField('state_country', event.target.value)
                }
                placeholder="Ex.: PR / Brasil"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Valor do contrato</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.contract_value}
                onChange={(event) =>
                  updateField('contract_value', event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Status</span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField('status', event.target.value)
                }
                style={inputStyle}
              >
                <option value="">Selecione</option>
                <option value="Monitoramento">Monitoramento</option>
                <option value="Planejamento">Planejamento</option>
                <option value="Licitação">Licitação</option>
                <option value="Contratação">Contratação</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Paralisada">Paralisada</option>
                <option value="Concluída">Concluída</option>
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Potencial comercial</span>

              <select
                value={form.potential}
                onChange={(event) =>
                  updateField('potential', event.target.value)
                }
                style={inputStyle}
              >
                <option value="">Selecione</option>
                <option value="Baixo">Baixo</option>
                <option value="Médio">Médio</option>
                <option value="Alto">Alto</option>
                <option value="Estratégico">Estratégico</option>
              </select>
            </label>

            <label
              style={{
                ...fieldStyle,
                gridColumn: '1 / -1',
              }}
            >
              <span style={labelStyle}>Observações</span>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField('notes', event.target.value)
                }
                rows={5}
                style={{
                  ...inputStyle,
                  paddingTop: 12,
                  resize: 'vertical',
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              className="btn"
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

const headerStyle = {
  padding: '16px 18px',
  textAlign: 'left' as const,
  color: '#53606b',
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
};

const cellStyle = {
  padding: '18px',
  color: '#27313a',
  fontSize: 14,
  verticalAlign: 'middle' as const,
};

const actionStyle = {
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  color: '#4b5563',
  fontSize: 14,
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 7,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
};

const inputStyle = {
  width: '100%',
  minHeight: 44,
  padding: '0 12px',
  border: '1px solid #d7dce1',
  borderRadius: 8,
  background: '#fff',
  color: '#222',
  fontSize: 14,
  boxSizing: 'border-box' as const,
};
