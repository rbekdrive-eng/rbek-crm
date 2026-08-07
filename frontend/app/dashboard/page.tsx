'use client';

import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { ErrorBox, Loading } from '@/components/State';
import { useEffect, useState } from 'react';

type DashboardData = {
  total_companies: number;
  high_priority: number;
  active_opportunities: number;
  potential_value: number;

  overdue_activities: number;
  next_activities_count: number;

  monitored_bids: number;
  urgent_bids: number;

  total_works: number;
  strategic_works: number;
  works_value: number;

  total_evidences: number;
  high_confidence_evidences: number;
  average_confidence: number;

  paraguay_companies: number;

  pipeline: Array<{
    status: string;
    total: number;
  }>;

  top_opportunities: any[];
  next_activities: any[];
  recent_evidences: any[];
  urgent_bid_list: any[];
};

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

function formatDateTime(value?: string | null) {
  if (!value) return 'Sem data';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sem data';
  }

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const normalized = value.slice(0, 10);
  const [year, month, day] =
    normalized.split('-');

  if (!year || !month || !day) {
    return '—';
  }

  return `${day}/${month}/${year}`;
}

function companyName(company?: any) {
  return (
    company?.trade_name ||
    company?.legal_name ||
    'Sem empresa'
  );
}

export default function Dashboard() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [err, setErr] = useState('');

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .catch((error) =>
        setErr(
          error?.message ||
            'Não foi possível carregar o dashboard.'
        )
      );
  }, []);

  return (
    <AppShell>
      <div className="title-row">
        <div>
          <span className="eyebrow">
            VISÃO GERAL
          </span>

          <h1>Dashboard executivo</h1>

          <p>
            Inteligência comercial, prioridades e
            próximos movimentos da R.BEK.
          </p>
        </div>

        <a
          className="btn primary"
          href="/oportunidades"
        >
          + Nova oportunidade
        </a>
      </div>

      {err ? (
        <ErrorBox message={err} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4, minmax(0, 1fr))',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <Metric
              label="Empresas monitoradas"
              value={data.total_companies}
              detail={`${data.high_priority} prioridade alta`}
            />

            <Metric
              label="Oportunidades ativas"
              value={
                data.active_opportunities
              }
              detail={money(
                data.potential_value
              )}
            />

            <Metric
              label="Follow-ups vencidos"
              value={
                data.overdue_activities
              }
              detail={`${data.next_activities_count} próximos`}
              warning={
                data.overdue_activities > 0
              }
            />

            <Metric
              label="Licitações ativas"
              value={data.monitored_bids}
              detail={`${data.urgent_bids} com prazo ≤ 7 dias`}
              warning={
                data.urgent_bids > 0
              }
            />

            <Metric
              label="Obras monitoradas"
              value={data.total_works}
              detail={`${data.strategic_works} alto potencial`}
            />

            <Metric
              label="Valor em obras"
              value={money(
                data.works_value
              )}
              detail="Carteira monitorada"
            />

            <Metric
              label="Evidências"
              value={data.total_evidences}
              detail={`${data.high_confidence_evidences} alta confiança`}
            />

            <Metric
              label="Confiança média"
              value={`${data.average_confidence}%`}
              detail="Base de inteligência"
            />
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1.45fr) minmax(330px, .55fr)',
              gap: 17,
              marginBottom: 17,
            }}
          >
            <div className="card panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    PIPELINE
                  </span>

                  <h2>
                    Oportunidades prioritárias
                  </h2>
                </div>

                <a href="/pipeline">
                  Ver pipeline →
                </a>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Oportunidade</th>
                      <th>Empresa</th>
                      <th>Status</th>
                      <th>Valor</th>
                      <th>Score</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.top_opportunities
                      .length ? (
                      data.top_opportunities.map(
                        (opportunity: any) => (
                          <tr
                            key={
                              opportunity.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  opportunity.title
                                }
                              </strong>
                            </td>

                            <td>
                              {companyName(
                                opportunity.company
                              )}
                            </td>

                            <td>
                              <span className="badge orange">
                                {
                                  opportunity.status
                                }
                              </span>
                            </td>

                            <td>
                              {money(
                                Number(
                                  opportunity.potential_value
                                )
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  opportunity.score
                                }
                              </strong>
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="muted"
                        >
                          Nenhuma oportunidade
                          cadastrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    PIPELINE
                  </span>

                  <h2>
                    Distribuição por fase
                  </h2>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 11,
                }}
              >
                {data.pipeline.map(
                  (stage) => {
                    const maximum =
                      Math.max(
                        ...data.pipeline.map(
                          (item) =>
                            item.total
                        ),
                        1
                      );

                    const width =
                      (stage.total /
                        maximum) *
                      100;

                    return (
                      <div
                        key={
                          stage.status
                        }
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            alignItems:
                              'center',
                            marginBottom: 5,
                            fontSize: 13,
                          }}
                        >
                          <span>
                            {stage.status}
                          </span>

                          <strong>
                            {stage.total}
                          </strong>
                        </div>

                        <div
                          style={{
                            height: 7,
                            borderRadius:
                              999,
                            background:
                              '#eef0f1',
                            overflow:
                              'hidden',
                          }}
                        >
                          <div
                            style={{
                              height:
                                '100%',
                              width: `${width}%`,
                              minWidth:
                                stage.total >
                                0
                                  ? 5
                                  : 0,
                              borderRadius:
                                999,
                              background:
                                'linear-gradient(90deg, #fdb54a, #f2a832)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="intel-box">
                <span>
                  RADAR R.BEK
                </span>

                <b>
                  {
                    data.paraguay_companies
                  }{' '}
                  empresas com presença ou
                  sinal no Paraguai
                </b>

                <p>
                  Cruze oportunidades,
                  evidências, obras e
                  decisores para priorizar
                  a abordagem comercial.
                </p>
              </div>
            </div>
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: 17,
            }}
          >
            <div className="card panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    AGENDA
                  </span>

                  <h2>
                    Próximas atividades
                  </h2>
                </div>

                <a href="/agenda">
                  Ver agenda →
                </a>
              </div>

              <div className="timeline">
                {data.next_activities
                  .length ? (
                  data.next_activities.map(
                    (activity: any) => (
                      <div
                        className="timeline-item"
                        key={activity.id}
                      >
                        <div className="timeline-dot" />

                        <div>
                          <b>
                            {activity.type}
                          </b>

                          <p>
                            {
                              activity.description
                            }
                          </p>

                          <small>
                            {companyName(
                              activity.company
                            )}{' '}
                            ·{' '}
                            {formatDateTime(
                              activity.scheduled_at
                            )}
                          </small>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="muted">
                    Nenhuma atividade
                    futura agendada.
                  </p>
                )}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    INTELIGÊNCIA
                  </span>

                  <h2>
                    Evidências recentes
                  </h2>
                </div>

                <a href="/evidencias">
                  Ver evidências →
                </a>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                }}
              >
                {data.recent_evidences
                  .length ? (
                  data.recent_evidences.map(
                    (evidence: any) => (
                      <div
                        key={evidence.id}
                        style={{
                          paddingBottom:
                            13,
                          borderBottom:
                            '1px solid #edf0f2',
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            gap: 12,
                            marginBottom: 5,
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 13,
                            }}
                          >
                            {
                              evidence.title
                            }
                          </strong>

                          <span
                            style={{
                              fontSize: 11,
                              color:
                                '#a76e17',
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {Number(
                              evidence.confidence ||
                                0
                            )}
                            %
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color:
                              '#747b7e',
                          }}
                        >
                          {companyName(
                            evidence.company
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            color:
                              '#92999d',
                          }}
                        >
                          {evidence.source_type ||
                            'Fonte não informada'}{' '}
                          ·{' '}
                          {formatDate(
                            evidence.published_at
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="muted">
                    Nenhuma evidência
                    registrada.
                  </p>
                )}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    LICITAÇÕES
                  </span>

                  <h2>
                    Prazos críticos
                  </h2>
                </div>

                <a href="/licitacoes">
                  Ver licitações →
                </a>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                }}
              >
                {data.urgent_bid_list
                  .length ? (
                  data.urgent_bid_list.map(
                    (bid: any) => (
                      <div
                        key={bid.id}
                        style={{
                          paddingBottom:
                            13,
                          borderBottom:
                            '1px solid #edf0f2',
                        }}
                      >
                        <strong
                          style={{
                            display:
                              'block',
                            fontSize: 13,
                            marginBottom: 5,
                          }}
                        >
                          {bid.agency}
                        </strong>

                        <div
                          style={{
                            fontSize: 12,
                            color:
                              '#747b7e',
                            lineHeight: 1.4,
                          }}
                        >
                          {bid.object}
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            color:
                              '#a76e17',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Prazo:{' '}
                          {formatDate(
                            bid.deadline_at
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="muted">
                    Nenhuma licitação com
                    prazo crítico.
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function Metric({
  label,
  value,
  detail,
  warning = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  warning?: boolean;
}) {
  return (
    <div className="card kpi">
      <div className="label">
        {label}
      </div>

      <div className="value">
        {value}
      </div>

      <div
        className={
          warning
            ? 'delta warn'
            : 'delta'
        }
      >
        {detail}
      </div>
    </div>
  );
}
