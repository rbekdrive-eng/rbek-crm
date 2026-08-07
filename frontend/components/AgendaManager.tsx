'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Loading, ErrorBox, Empty } from './State';

type Company = {
  id: number;
  trade_name?: string;
  legal_name?: string;
};

type Opportunity = {
  id: number;
  title: string;
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

const weekDays = [
  'Dom.',
  'Seg.',
  'Ter.',
  'Qua.',
  'Qui.',
  'Sex.',
  'Sáb.',
];

const monthNames = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function companyName(company?: Company | null) {
  if (!company) return '—';

  return company.trade_name || company.legal_name || '—';
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusColors(status: string) {
  if (status === 'Concluída') {
    return {
      background: '#e7f6eb',
      color: '#25733b',
      border: '#ccebd4',
    };
  }

  if (status === 'Cancelada') {
    return {
      background: '#f1f3f4',
      color: '#737b80',
      border: '#dfe3e5',
    };
  }

  if (status === 'Em andamento') {
    return {
      background: '#fff4df',
      color: '#936117',
      border: '#f5dfb5',
    };
  }

  return {
    background: '#fff9ed',
    color: '#805816',
    border: '#f1d79e',
  };
}

export default function AgendaManager() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [startDate, setStartDate] = useState<Date>(
    startOfDay(new Date())
  );

  async function load() {
    try {
      setLoading(true);
      setErr('');

      const response = await api<any>(
        '/activities?per_page=300'
      );

      const data =
        response?.data?.data ??
        response?.data ??
        response ??
        [];

      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setErr(
        error?.message ||
          'Não foi possível carregar a agenda.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      addDays(startDate, index)
    );
  }, [startDate]);

  const scheduledItems = useMemo(() => {
    return items
      .filter((item) => item.scheduled_at)
      .sort((a, b) => {
        const first = new Date(
          a.scheduled_at as string
        ).getTime();

        const second = new Date(
          b.scheduled_at as string
        ).getTime();

        return first - second;
      });
  }, [items]);

  const visibleItems = useMemo(() => {
    const first = startOfDay(days[0]);
    const last = addDays(startOfDay(days[6]), 1);

    return scheduledItems.filter((item) => {
      if (!item.scheduled_at) return false;

      const date = new Date(item.scheduled_at);

      return date >= first && date < last;
    });
  }, [scheduledItems, days]);

  const pendingCount = useMemo(
    () =>
      visibleItems.filter(
        (item) =>
          item.status !== 'Concluída' &&
          item.status !== 'Cancelada'
      ).length,
    [visibleItems]
  );

  function previousWeek() {
    setStartDate((current) =>
      addDays(current, -7)
    );
  }

  function nextWeek() {
    setStartDate((current) =>
      addDays(current, 7)
    );
  }

  function today() {
    setStartDate(startOfDay(new Date()));
  }

  const periodLabel = useMemo(() => {
    const first = days[0];
    const last = days[6];

    if (
      first.getMonth() === last.getMonth() &&
      first.getFullYear() === last.getFullYear()
    ) {
      return `${first.getDate()} a ${last.getDate()} de ${
        monthNames[first.getMonth()]
      } de ${first.getFullYear()}`;
    }

    return `${first.getDate()} de ${
      monthNames[first.getMonth()]
    } a ${last.getDate()} de ${
      monthNames[last.getMonth()]
    } de ${last.getFullYear()}`;
  }, [days]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 24,
          marginBottom: 26,
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
            FOLLOW-UP
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.15,
              color: '#202b33',
            }}
          >
            Agenda comercial
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 18,
              color: '#6d7479',
            }}
          >
            Compromissos, contatos e ações de prospecção.
          </p>
        </div>

        <a
          href="/atividades"
          className="btn primary"
          style={{
            flexShrink: 0,
            minHeight: 48,
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            paddingLeft: 22,
            paddingRight: 22,
          }}
        >
          + Nova atividade
        </a>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn light"
            onClick={previousWeek}
          >
            ←
          </button>

          <button
            type="button"
            className="btn light"
            onClick={today}
          >
            Hoje
          </button>

          <button
            type="button"
            className="btn light"
            onClick={nextWeek}
          >
            →
          </button>

          <strong
            style={{
              marginLeft: 8,
              fontSize: 15,
              color: '#39444b',
            }}
          >
            {periodLabel}
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
          <span
            style={{
              background: '#fff',
              border: '1px solid #e0e4e7',
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 13,
              color: '#5f686d',
            }}
          >
            {visibleItems.length}{' '}
            {visibleItems.length === 1
              ? 'compromisso'
              : 'compromissos'}
          </span>

          <span
            style={{
              background: '#fff4df',
              border: '1px solid #f1d79e',
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 13,
              color: '#805816',
            }}
          >
            {pendingCount} pendentes
          </span>
        </div>
      </div>

      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(7, minmax(190px, 1fr))',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 8,
          }}
        >
          {days.map((day) => {
            const dayActivities =
              scheduledItems.filter((item) => {
                if (!item.scheduled_at) return false;

                return sameDay(
                  new Date(item.scheduled_at),
                  day
                );
              });

            const isToday = sameDay(
              day,
              new Date()
            );

            return (
              <section
                key={day.toISOString()}
                style={{
                  minWidth: 190,
                  minHeight: 430,
                  background: '#fff',
                  border: isToday
                    ? '2px solid #fdb54a'
                    : '1px solid #e0e4e7',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow:
                    '0 8px 24px rgba(50,55,56,.04)',
                }}
              >
                <div
                  style={{
                    padding: '15px 15px 13px',
                    borderBottom:
                      '1px solid #e7eaec',
                    background: isToday
                      ? '#fff9ed'
                      : '#fff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 15,
                        color: '#202b33',
                      }}
                    >
                      {weekDays[day.getDay()]}
                    </strong>

                    <strong
                      style={{
                        fontSize: 24,
                        color: isToday
                          ? '#c78310'
                          : '#202b33',
                      }}
                    >
                      {day.getDate()}
                    </strong>
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: '#8a9297',
                    }}
                  >
                    {monthNames[day.getMonth()]}
                  </div>
                </div>

                <div
                  style={{
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                  }}
                >
                  {!dayActivities.length ? (
                    <div
                      style={{
                        padding: '14px 5px',
                        color: '#9aa1a5',
                        fontSize: 13,
                        textAlign: 'center',
                      }}
                    >
                      Sem atividades
                    </div>
                  ) : (
                    dayActivities.map((activity) => {
                      const colors =
                        statusColors(
                          activity.status
                        );

                      return (
                        <a
                          key={activity.id}
                          href="/atividades"
                          style={{
                            display: 'block',
                            padding: '11px 11px 12px',
                            borderRadius: 11,
                            border: `1px solid ${colors.border}`,
                            background:
                              colors.background,
                            textDecoration: 'none',
                            color: '#202b33',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              gap: 8,
                              marginBottom: 7,
                            }}
                          >
                            <strong
                              style={{
                                fontSize: 13,
                              }}
                            >
                              {activity.type}
                            </strong>

                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  colors.color,
                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              {formatTime(
                                activity.scheduled_at
                              )}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 13,
                              lineHeight: 1.35,
                              fontWeight: 600,
                              marginBottom: 7,
                            }}
                          >
                            {activity.description}
                          </div>

                          {activity.company && (
                            <div
                              style={{
                                fontSize: 12,
                                color: '#6f777c',
                                marginBottom: 5,
                              }}
                            >
                              {companyName(
                                activity.company
                              )}
                            </div>
                          )}

                          {activity.opportunity && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#848c91',
                                marginBottom: 7,
                              }}
                            >
                              {
                                activity
                                  .opportunity
                                  .title
                              }
                            </div>
                          )}

                          <span
                            style={{
                              display:
                                'inline-flex',
                              padding: '3px 7px',
                              borderRadius: 999,
                              background:
                                'rgba(255,255,255,.65)',
                              fontSize: 10,
                              fontWeight: 700,
                              color:
                                colors.color,
                            }}
                          >
                            {activity.status}
                          </span>
                        </a>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!loading &&
        !err &&
        !scheduledItems.length && (
          <div
            style={{
              marginTop: 22,
            }}
          >
            <Empty label="Nenhuma atividade com data agendada." />
          </div>
        )}
    </>
  );
}
