'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { Company, Opportunity } from '@/lib/types';

import Modal from './Modal';
import { Empty, ErrorBox, Loading } from './State';

const statuses = [
  'Identificada',
  'Em análise',
  'Contato iniciado',
  'Proposta enviada',
  'Negociação',
  'Ganha',
  'Perdida',
];

type OpportunityForm = {
  company_id: number | '';
  title: string;
  type: string;
  potential_service: string;
  potential_value: number;
  status: string;
  probability: number;
  score: number;
  next_step_at: string;
  summary: string;
  source_url: string;
};

const emptyForm: OpportunityForm = {
  company_id: '',
  title: '',
  type: '',
  potential_service: '',
  potential_value: 0,
  status: 'Identificada',
  probability: 20,
  score: 70,
  next_step_at: '',
  summary: '',
  source_url: '',
};

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);

export default function OpportunityManager() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const [form, setForm] = useState<OpportunityForm>(emptyForm);

  async function load() {
    try {
      setErr('');

      const [opportunitiesResponse, companiesResponse] = await Promise.all([
        api<{ data: Opportunity[] }>('/opportunities?per_page=200'),
        api<{ data: Company[] }>('/companies?per_page=300'),
      ]);

      setItems(opportunitiesResponse.data);
      setCompanies(companiesResponse.data);
    } catch (error: any) {
      setErr(error?.message || 'Não foi possível carregar as oportunidades.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return items;
    }

    return items.filter((item) => {
      const content = [
        item.title,
        item.type,
        item.status,
        item.company?.trade_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return content.includes(search);
    });
  }, [items, query]);

  function create() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function edit(item: Opportunity) {
    setEditing(item.id);

    setForm({
      company_id: item.company_id || '',
      title: item.title || '',
      type: item.type || '',
      potential_service: item.potential_service || '',
      potential_value: Number(item.potential_value || 0),
      status: item.status || 'Identificada',
      probability: Number(item.probability || 0),
      score: Number(item.score || 0),
      next_step_at: item.next_step_at
        ? item.next_step_at.slice(0, 10)
        : '',
      summary: item.summary || '',
      source_url: item.source_url || '',
    });

    setOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (!form.company_id) {
      alert('Selecione uma empresa.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        company_id: Number(form.company_id),
        potential_value: Number(form.potential_value || 0),
        probability: Number(form.probability || 0),
        score: Number(form.score || 0),
        next_step_at: form.next_step_at || null,
      };

      await api(
        editing
          ? `/opportunities/${editing}`
          : '/opportunities',
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      );

      closeModal();

      setLoading(true);
      await load();
    } catch (error: any) {
      alert(error?.message || 'Não foi possível salvar a oportunidade.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const confirmed = window.confirm(
      'Excluir esta oportunidade? Esta ação não poderá ser desfeita.',
    );

    if (!confirmed) {
      return;
    }

    try {
      await api(`/opportunities/${id}`, {
        method: 'DELETE',
      });

      setItems((current) =>
        current.filter((item) => item.id !== id),
      );
    } catch (error: any) {
      alert(error?.message || 'Não foi possível excluir a oportunidade.');
    }
  }

  return (
    <>
      <div className="title-row">
        <div>
          <span className="eyebrow">PIPELINE</span>

          <h1>Oportunidades</h1>

          <p>
            Negócios potenciais, próximos passos e valor em carteira.
          </p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={create}
        >
          + Nova oportunidade
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar oportunidade ou empresa..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <Link
          href="/pipeline"
          className="btn light"
        >
          Visualizar Kanban
        </Link>

        <span className="result-count">
          {filtered.length}{' '}
          {filtered.length === 1
            ? 'oportunidade'
            : 'oportunidades'}
        </span>
      </div>

      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : !filtered.length ? (
<Empty label="Nenhuma oportunidade encontrada." /> 
    ) : (
        <div className="card panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Oportunidade</th>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Prob.</th>
                  <th>Score</th>
                  <th>Próximo passo</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>

                      {item.type ? (
                        <small className="block">
                          {item.type}
                        </small>
                      ) : null}
                    </td>

                    <td>
                      {item.company?.trade_name || '—'}
                    </td>

                    <td>
                      <span
                        className={
                          item.status === 'Ganha'
                            ? 'badge green'
                            : item.status === 'Perdida'
                              ? 'badge red'
                              : 'badge orange'
                        }
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {money(Number(item.potential_value))}
                    </td>

                    <td>
                      {item.probability}%
                    </td>

                    <td>
                      <strong>{item.score}</strong>
                    </td>

                    <td>
                      {item.next_step_at
                        ? new Date(
                            `${item.next_step_at.slice(
                              0,
                              10,
                            )}T00:00:00`,
                          ).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>

                    <td className="row-actions">
                      <button
                        type="button"
                        onClick={() => edit(item)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={open}
        title={
          editing
            ? 'Editar oportunidade'
            : 'Nova oportunidade'
        }
        onClose={closeModal}
      >
        <form
          className="form-grid"
          onSubmit={save}
        >
          <label className="span2">
            Empresa

            <select
              value={form.company_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  company_id: event.target.value
                    ? Number(event.target.value)
                    : '',
                }))
              }
              required
            >
              <option value="">
                Selecione uma empresa
              </option>

              {companies.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.trade_name}
                </option>
              ))}
            </select>
          </label>

          <label className="span2">
            Título

            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Ex.: Implantação industrial no Paraguai"
              required
            />
          </label>

          <label>
            Tipo

            <input
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
              placeholder="Ex.: Expansão industrial"
            />
          </label>

          <label>
            Status

            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Valor potencial

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.potential_value}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  potential_value: Number(
                    event.target.value,
                  ),
                }))
              }
            />
          </label>

          <label>
            Probabilidade (%)

            <input
              type="number"
              min="0"
              max="100"
              value={form.probability}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  probability: Number(
                    event.target.value,
                  ),
                }))
              }
            />
          </label>

          <label>
            Score

            <input
              type="number"
              min="0"
              max="100"
              value={form.score}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  score: Number(
                    event.target.value,
                  ),
                }))
              }
            />
          </label>

          <label>
            Próximo passo

            <input
              type="date"
              value={form.next_step_at}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  next_step_at: event.target.value,
                }))
              }
            />
          </label>

          <label className="span2">
            Serviço potencial

            <textarea
              rows={2}
              value={form.potential_service}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  potential_service:
                    event.target.value,
                }))
              }
              placeholder="Serviço que pode ser contratado pela empresa."
            />
          </label>

          <label className="span2">
            Resumo

            <textarea
              rows={4}
              value={form.summary}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              placeholder="Contexto comercial, necessidade identificada e observações."
            />
          </label>

          <label className="span2">
            URL da fonte

            <input
              type="url"
              value={form.source_url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  source_url: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </label>

          <div className="form-actions span2">
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
                  : 'Criar oportunidade'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
