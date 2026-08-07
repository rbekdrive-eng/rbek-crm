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

type Contact = {
  id: number;
  company_id: number;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  decision_maker?: boolean;
  company?: Company | null;
};

type ContactForm = {
  company_id: number | '';
  name: string;
  role: string;
  email: string;
  phone: string;
  decision_maker: boolean;
};

const emptyForm: ContactForm = {
  company_id: '',
  name: '',
  role: '',
  email: '',
  phone: '',
  decision_maker: false,
};

function companyName(company?: Company | null) {
  if (!company) return '—';

  return company.trade_name || company.legal_name || '—';
}

export default function ContactManager() {
  const [items, setItems] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr('');

      const [contactsResponse, companiesResponse] = await Promise.all([
        api<any>('/contacts?per_page=300'),
        api<any>('/companies?per_page=300'),
      ]);

      const contactsData =
        contactsResponse?.data?.data ??
        contactsResponse?.data ??
        contactsResponse ??
        [];

      const companiesData =
        companiesResponse?.data?.data ??
        companiesResponse?.data ??
        companiesResponse ??
        [];

      setItems(Array.isArray(contactsData) ? contactsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (error: any) {
      setErr(error?.message || 'Não foi possível carregar os contatos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return items;
    }

    return items.filter((contact) => {
      const text = [
        contact.name,
        contact.role,
        contact.email,
        contact.phone,
        companyName(contact.company),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(search);
    });
  }, [items, query]);

  function newContact() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function editContact(contact: Contact) {
    setEditing(contact.id);

    setForm({
      company_id: contact.company_id || '',
      name: contact.name || '',
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      decision_maker: Boolean(contact.decision_maker),
    });

    setOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.company_id) {
      alert('Selecione uma empresa.');
      return;
    }

    if (!form.name.trim()) {
      alert('Informe o nome do contato.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        company_id: Number(form.company_id),
        name: form.name.trim(),
        role: form.role.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        decision_maker: form.decision_maker,
      };

      if (editing) {
        await api(`/contacts/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/contacts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      closeModal();
      await load();
    } catch (error: any) {
      alert(error?.message || 'Não foi possível salvar o contato.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact(id: number) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este contato?'
    );

    if (!confirmed) return;

    try {
      await api(`/contacts/${id}`, {
        method: 'DELETE',
      });

      await load();
    } catch (error: any) {
      alert(error?.message || 'Não foi possível excluir o contato.');
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">INTELIGÊNCIA COMERCIAL</div>

          <h1>Contatos e decisores</h1>

          <p>
            Pessoas-chave vinculadas às empresas monitoradas.
          </p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={newContact}
        >
          + Novo contato
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar contato, empresa, cargo ou e-mail..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="muted">
          {filtered.length}{' '}
          {filtered.length === 1 ? 'contato' : 'contatos'}
        </div>
      </div>

      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty text="Nenhum contato encontrado." />
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>NOME</th>
                <th>EMPRESA</th>
                <th>CARGO</th>
                <th>E-MAIL</th>
                <th>TELEFONE</th>
                <th>DECISOR</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <strong>{contact.name}</strong>
                  </td>

                  <td>{companyName(contact.company)}</td>

                  <td>{contact.role || '—'}</td>

                  <td>
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`}>
                        {contact.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td>
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`}>
                        {contact.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td>
                    {contact.decision_maker ? (
                      <span className="badge success">
                        Sim
                      </span>
                    ) : (
                      <span className="badge">
                        Não
                      </span>
                    )}
                  </td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => editContact(contact)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="link-button"
                        onClick={() => deleteContact(contact.id)}
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
        open={open}
        title={editing ? 'Editar contato' : 'Novo contato'}
        onClose={closeModal}
      >
        <form onSubmit={saveContact}>
          <div className="form-grid">
            <label className="full">
              Empresa

              <select
                value={form.company_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    company_id: event.target.value
                      ? Number(event.target.value)
                      : '',
                  })
                }
                required
              >
                <option value="">Selecione</option>

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
              Nome

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Cargo

              <input
                type="text"
                value={form.role}
                onChange={(event) =>
                  setForm({
                    ...form,
                    role: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Telefone

              <input
                type="text"
                value={form.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone: event.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              E-mail

              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
              />
            </label>

            <label
              className="full"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <input
                type="checkbox"
                checked={form.decision_maker}
                onChange={(event) =>
                  setForm({
                    ...form,
                    decision_maker: event.target.checked,
                  })
                }
                style={{
                  width: 'auto',
                }}
              />

              Este contato é um decisor
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
                  : 'Criar contato'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
