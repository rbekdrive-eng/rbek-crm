'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import Modal from './Modal';
import { Loading, ErrorBox, Empty } from './State';

type Company = {
  id: number;
  trade_name?: string;
  legal_name?: string;
};

type Opportunity = {
  id: number;
  title: string;
  company_id?: number;
  company?: Company | null;
};

type Activity = {
  id: number;
  company_id?: number | null;
  opportunity_id?: number | null;
  type: string;
  scheduled_at?: string | null;
  description: string;
  result?: string | null;
  status: string;
  company?: Company | null;
  opportunity?: Opportunity | null;
};

type ActivityForm = {
  company_id: number | '';
  opportunity_id: number | '';
  type: string;
  scheduled_at: string;
  description: string;
  result: string;
  status: string;
};

const activityTypes = [
  'Follow-up',
  'Ligação',
  'Reunião',
  'E-mail',
  'WhatsApp',
  'Visita',
  'Proposta',
  'Tarefa',
];

const activityStatuses = [
  'Pendente',
  'Em andamento',
  'Concluída',
  'Cancelada',
];

const emptyForm: ActivityForm = {
  company_id: '',
  opportunity_id: '',
  type: 'Follow-up',
  scheduled_at: '',
  description: '',
  result: '',
  status: 'Pendente',
};

function companyName(company?: Company | null) {
  if (!company) return '—';

  return company.trade_name || company.legal_name || '—';
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function statusStyle(status: string) {
  if (status === 'Concluída') {
    return {
      background: '#e7f6eb',
      color: '#25733b',
    };
  }

  if (status === 'Cancelada') {
    return {
      background: '#f1f3f4',
      color: '#737b80',
    };
  }

  if (status === 'Em andamento') {
    return {
      background: '#fff4df',
      color: '#936117',
    };
  }

  return {
    background: '#eef0f1',
    color: '#555a5c',
  };
}

export default function ActivityManager() {
  const [items, setItems] = useState<Activity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<ActivityForm>(emptyForm);

  async function load() {
    try {
      setLoading(true);
      setErr('');

      const [
        activitiesResponse,
        companiesResponse,
        opportunitiesResponse,
      ] = await Promise.all([
        api<any>('/activities?per_page=300'),
        api<any>('/companies?per_page=300'),
        api<any>('/opportunities?per_page=300'),
      ]);

      const activitiesData =
        activitiesResponse?.data?.data ??
        activitiesResponse?.data ??
        activitiesResponse ??
        [];

      const companiesData =
        companiesResponse?.data?.data ??
        companiesResponse?.data ??
        companiesResponse ??
        [];

      const opportunitiesData =
        opportunitiesResponse?.data?.data ??
        opportunitiesResponse?.data ??
        opportunitiesResponse ??
        [];

      setItems(Array.isArray(activitiesData) ? activitiesData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setOpportunities(
        Array.isArray(opportunitiesData) ? opportunitiesData : []
      );
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível carregar as atividades.'
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

    return items.filter((activity) => {
      const matchesStatus =
        !statusFilter || activity.status === statusFilter;

      if (!matchesStatus) return false;

      if (!search) return true;

      const text = [
        activity.type,
        activity.description,
        activity.result,
        activity.status,
        companyName(activity.company),
        activity.opportunity?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(search);
    });
  }, [items, query, statusFilter]);

  const pendingCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status !== 'Concluída' &&
          item.status !== 'Cancelada'
      ).length,
    [items]
  );

  function newActivity() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function editActivity(activity: Activity) {
    setEditing(activity.id);

    setForm({
      company_id: activity.company_id || '',
      opportunity_id: activity.opportunity_id || '',
      type: activity.type || 'Follow-up',
      scheduled_at: toDateTimeLocal(activity.scheduled_at),
      description: activity.description || '',
      result: activity.result || '',
      status: activity.status || 'Pendente',
    });

    setOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function activityPayload(source: ActivityForm) {
    return {
      company_id: source.company_id
        ? Number(source.company_id)
        : null,

      opportunity_id: source.opportunity_id
        ? Number(source.opportunity_id)
        : null,

      type: source.type,
      scheduled_at: source.scheduled_at || null,
      description: source.description.trim(),
      result: source.result.trim() || null,
      status: source.status,
    };
  }

  async function saveActivity(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.type) {
      alert('Selecione o tipo da atividade.');
      return;
    }

    if (!form.description.trim()) {
      alert('Informe a descrição da atividade.');
      return;
    }

    try {
      setSaving(true);

      const payload = activityPayload(form);

      if (editing) {
        await api(`/activities/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/activities', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);

      await load();
    } catch (error: any) {
      alert(
        error?.message ||
          'Não foi possível salvar a atividade.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function completeActivity(activity: Activity) {
    try {
      const payload = {
        company_id: activity.company_id || null,
        opportunity_id: activity.opportunity_id || null,
        type: activity.type,
        scheduled_at: activity.scheduled_at || null,
        description: activity.description,
        result: activity.result || null,
        status: 'Concluída',
      };

      await api(`/activities/${activity.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await load();
    } catch (error: any) {
      alert(
        error?.message ||
          'Não foi possível concluir a atividade.'
      );
    }
  }

  async function deleteActivity(id: number) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta atividade?'
    );

    if (!confirmed) return;

    try {
      await api(`/activities/${id}`, {
        method: 'DELETE',
      });

      await load();
    } catch (error: any) {
      alert(
        error?.message ||
          'Não foi possível excluir a atividade.'
      );
    }
  }

  const availableOpportunities = useMemo(() => {
    if (!form.company_id) return opportunities;

    return opportunities.filter(
      (opportunity) =>
        Number(opportunity.company_id) ===
          Number(form.company_id) ||
        Number(opportunity.company?.id) ===
          Number(form.company_id)
    );
  }, [opportunities, form.company_id]);

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
            Atividades e follow-ups
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 18,
              color: '#6d7479',
            }}
          >
            Agenda comercial, resultados e próximos passos.
          </p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={newActivity}
          style={{
            flexShrink: 0,
            minHeight: 48,
            paddingLeft: 22,
            paddingRight: 22,
          }}
        >
          + Nova atividade
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 16,
          marginBottom: 22,
          maxWidth: 520,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e0e4e7',
            borderRadius: 14,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              color: '#747b7e',
              fontSize: 13,
              marginBottom: 5,
            }}
          >
            Atividades cadastradas
          </div>

          <strong
            style={{
              fontSize: 25,
              color: '#202b33',
            }}
          >
            {items.length}
          </strong>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e0e4e7',
            borderRadius: 14,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              color: '#747b7e',
              fontSize: 13,
              marginBottom: 5,
            }}
          >
            Pendentes
          </div>

          <strong
            style={{
              fontSize: 25,
              color: '#202b33',
            }}
          >
            {pendingCount}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            type="text"
            placeholder="Buscar atividade, empresa ou oportunidade..."
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            style={{
              width: '100%',
              minHeight: 48,
              padding: '0 16px',
              border: '1px solid #d9dee2',
              borderRadius: 12,
              background: '#fff',
              fontSize: 16,
              outline: 'none',
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            style={{
              minWidth: 180,
              minHeight: 48,
              padding: '0 14px',
              border: '1px solid #d9dee2',
              borderRadius: 12,
              background: '#fff',
              fontSize: 15,
            }}
          >
            <option value="">Todos os status</option>

            {activityStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            color: '#737b80',
            fontSize: 14,
            whiteSpace: 'nowrap',
          }}
        >
          {filtered.length}{' '}
          {filtered.length === 1
            ? 'atividade'
            : 'atividades'}
        </div>
      </div>

      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="Nenhuma atividade encontrada." />
      ) : (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e0e4e7',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 1100,
              }}
            >
              <thead>
                <tr>
                  {[
                    'TIPO',
                    'EMPRESA',
                    'OPORTUNIDADE',
                    'DESCRIÇÃO',
                    'DATA',
                    'STATUS',
                    'AÇÕES',
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: '17px 15px',
                        borderBottom:
                          '1px solid #e4e7e9',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: '#667077',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((activity) => {
                  const badge = statusStyle(
                    activity.status
                  );

                  return (
                    <tr key={activity.id}>
                      <td
                        style={{
                          padding: '18px 15px',
                          borderBottom:
                            '1px solid #edf0f2',
                          verticalAlign: 'top',
                        }}
                      >
                        <strong
                          style={{
                            color: '#202b33',
                          }}
                        >
                          {activity.type}
                        </strong>
                      </td>

                      <td
                        style={{
                          padding: '18px 15px',
                          borderBottom:
                            '1px solid #edf0f2',
                          verticalAlign: 'top',
                          color: '#39444b',
                        }}
                      >
                        {companyName(activity.company)}
                      </td>

                      <td
                        style={{
                          padding: '18px 15px',
                          borderBottom:
                            '1px solid #edf0f2',
                          verticalAlign: 'top',
                          color: '#39444b',
                        }}
                      >
                        {activity.opportunity?.title ||
                          '—'}
                      </td>

                      <td
                        style={{
                          padding: '18px 15px',
                          borderBottom:
                            '1px solid #edf0f2',
                          verticalAlign: 'top',
                          color: '#39444b',
                          maxWidth: 300,
                        }}
                      >
                        {activity.description}
                      </td>

                      <td
                        style={{
                          padding: '18px 15px',
                          borderBottom:
                            '1px solid #edf0f2',
                          verticalAlign: 'top',
                          color: '#39444b',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(
                          activity.scheduled_at
                        )}
                      </td>

                      <td
                        style={{
                          padding: '18px 15px',
                          borderBottom:
                            '1px solid #edf0f2',
                          verticalAlign: 'top',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '6px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...badge,
                          }}
                        >
                          {activity.status}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '18px 15px',
                          borderBottom:
                            '1px solid #edf0f2',
                          verticalAlign: 'top',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {activity.status !==
                            'Concluída' &&
                            activity.status !==
                              'Cancelada' && (
                              <button
                                type="button"
                                onClick={() =>
                                  completeActivity(
                                    activity
                                  )
                                }
                                style={{
                                  border: 0,
                                  padding: 0,
                                  background:
                                    'transparent',
                                  color: '#25733b',
                                  cursor: 'pointer',
                                  fontSize: 14,
                                }}
                              >
                                Concluir
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() =>
                              editActivity(activity)
                            }
                            style={{
                              border: 0,
                              padding: 0,
                              background:
                                'transparent',
                              color: '#536069',
                              cursor: 'pointer',
                              fontSize: 14,
                            }}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteActivity(
                                activity.id
                              )
                            }
                            style={{
                              border: 0,
                              padding: 0,
                              background:
                                'transparent',
                              color: '#536069',
                              cursor: 'pointer',
                              fontSize: 14,
                            }}
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
        </div>
      )}

      <Modal
        open={open}
        title={
          editing
            ? 'Editar atividade'
            : 'Nova atividade'
        }
        onClose={closeModal}
      >
        <form onSubmit={saveActivity}>
          <div className="form-grid">
            <label>
              Tipo

              <select
                value={form.type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    type: event.target.value,
                  })
                }
                required
              >
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status

              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value,
                  })
                }
                required
              >
                {activityStatuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </label>

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

            <label className="full">
              Oportunidade

              <select
                value={form.opportunity_id}
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

            <label className="full">
              Data e horário

              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(event) =>
                  setForm({
                    ...form,
                    scheduled_at:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              Descrição

              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Descreva a atividade, objetivo ou próximo passo..."
                required
              />
            </label>

            <label className="full">
              Resultado / observações

              <textarea
                rows={3}
                value={form.result}
                onChange={(event) =>
                  setForm({
                    ...form,
                    result: event.target.value,
                  })
                }
                placeholder="Resultado da ligação, reunião, follow-up etc."
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
                  : 'Criar atividade'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
