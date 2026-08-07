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
    void load();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return items;

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

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);

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
            Contatos e decisores
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 18,
              color: '#6d7479',
            }}
          >
            Pessoas-chave vinculadas às empresas monitoradas.
          </p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={newContact}
          style={{
            flexShrink: 0,
            minHeight: 48,
            paddingLeft: 22,
            paddingRight: 22,
          }}
        >
          + Novo contato
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 18,
        }}
      >
        <input
          type="text"
          placeholder="Buscar contato, empresa, cargo ou e-mail..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: '100%',
            maxWidth: 460,
            minHeight: 48,
            padding: '0 16px',
            border: '1px solid #d9dee2',
            borderRadius: 12,
            background: '#fff',
            fontSize: 16,
            outline: 'none',
          }}
        />

        <div
          style={{
            color: '#737b80',
            fontSize: 14,
            whiteSpace: 'nowrap',
          }}
        >
          {filtered.length}{' '}
          {filtered.length === 1 ? 'contato' : 'contatos'}
        </div>
      </div>

      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="Nenhum contato encontrado." />
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
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  {[
                    ['NOME', '19%'],
                    ['EMPRESA', '22%'],
                    ['CARGO', '16%'],
                    ['E-MAIL', '17%'],
                    ['TELEFONE', '12%'],
                    ['DECISOR', '7%'],
                    ['', '7%'],
                  ].map(([label, width]) => (
                    <th
                      key={`${label}-${width}`}
                      style={{
                        width,
                        padding: '18px 16px',
                        borderBottom: '1px solid #e4e7e9',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: '#667077',
                        verticalAlign: 'middle',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((contact) => (
                  <tr key={contact.id}>
                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: '1px solid #edf0f2',
                        verticalAlign: 'middle',
                      }}
                    >
                      <strong
                        style={{
                          color: '#202b33',
                          fontSize: 15,
                        }}
                      >
                        {contact.name}
                      </strong>
                    </td>

                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: '1px solid #edf0f2',
                        verticalAlign: 'middle',
                        color: '#39444b',
                        fontSize: 14,
                      }}
                    >
                      {companyName(contact.company)}
                    </td>

                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: '1px solid #edf0f2',
                        verticalAlign: 'middle',
                        color: '#39444b',
                        fontSize: 14,
                      }}
                    >
                      {contact.role || '—'}
                    </td>

                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: '1px solid #edf0f2',
                        verticalAlign: 'middle',
                        fontSize: 14,
                      }}
                    >
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          style={{
                            color: '#39444b',
                            textDecoration: 'none',
                          }}
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <span style={{ color: '#8a9297' }}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: '1px solid #edf0f2',
                        verticalAlign: 'middle',
                        fontSize: 14,
                      }}
                    >
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          style={{
                            color: '#39444b',
                            textDecoration: 'none',
                          }}
                        >
                          {contact.phone}
                        </a>
                      ) : (
                        <span style={{ color: '#8a9297' }}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: '1px solid #edf0f2',
                        verticalAlign: 'middle',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 42,
                          padding: '5px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: contact.decision_maker
                            ? '#e7f6eb'
                            : '#f1f3f4',
                          color: contact.decision_maker
                            ? '#25733b'
                            : '#697177',
                        }}
                      >
                        {contact.decision_maker ? 'Sim' : 'Não'}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: '1px solid #edf0f2',
                        verticalAlign: 'middle',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 16,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => editContact(contact)}
                          style={{
                            padding: 0,
                            border: 0,
                            background: 'transparent',
                            color: '#536069',
                            cursor: 'pointer',
                            fontSize: 14,
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteContact(contact.id)}
                          style={{
                            padding: 0,
                            border: 0,
                            background: 'transparent',
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
                ))}
              </tbody>
            </table>
          </div>
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
                  <option key={company.id} value={company.id}>
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
