<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Bid;
use App\Models\Company;
use App\Models\Evidence;
use App\Models\Opportunity;
use App\Models\Work;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $lostOpportunityStatuses = [
            'Perdida',
        ];

        $closedOpportunityStatuses = [
            'Ganha',
            'Perdida',
        ];

        $finishedActivityStatuses = [
            'Concluída',
            'Cancelada',
        ];

        $finishedBidStatuses = [
            'Vencida',
            'Perdida',
            'Cancelada',
        ];

        $pipelineStages = [
            'Identificada',
            'Em análise',
            'Contato iniciado',
            'Proposta enviada',
            'Negociação',
            'Ganha',
            'Perdida',
        ];

        $pipelineRaw = Opportunity::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $pipeline = collect($pipelineStages)
            ->map(function ($status) use ($pipelineRaw) {
                return [
                    'status' => $status,
                    'total' => (int) ($pipelineRaw[$status] ?? 0),
                ];
            })
            ->values();

        $today = now()->startOfDay();
        $sevenDays = now()->addDays(7)->endOfDay();

        return [
            'total_companies' => Company::count(),

            'high_priority' => Company::where(
                'priority',
                'Alta'
            )->count(),

            'active_opportunities' => Opportunity::whereNotIn(
                'status',
                $closedOpportunityStatuses
            )->count(),

            'potential_value' => (float) Opportunity::whereNotIn(
                'status',
                $lostOpportunityStatuses
            )->sum('potential_value'),

            'overdue_activities' => Activity::whereNotIn(
                'status',
                $finishedActivityStatuses
            )
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '<', now())
                ->count(),

            'next_activities_count' => Activity::whereNotIn(
                'status',
                $finishedActivityStatuses
            )
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '>=', now())
                ->count(),

            'monitored_bids' => Bid::whereNotIn(
                'status',
                $finishedBidStatuses
            )->count(),

            'urgent_bids' => Bid::whereNotIn(
                'status',
                $finishedBidStatuses
            )
                ->whereNotNull('deadline_at')
                ->whereBetween(
                    'deadline_at',
                    [$today, $sevenDays]
                )
                ->count(),

            'total_works' => Work::count(),

            'strategic_works' => Work::whereIn(
                'potential',
                ['Alto', 'Estratégico']
            )->count(),

            'works_value' => (float) Work::sum(
                'contract_value'
            ),

            'total_evidences' => Evidence::count(),

            'high_confidence_evidences' => Evidence::where(
                'confidence',
                '>=',
                80
            )->count(),

            'average_confidence' => round(
                (float) (
                    Evidence::avg('confidence') ?? 0
                )
            ),

            'paraguay_companies' => Company::where(
                function ($query) {
                    $query
                        ->whereRaw(
                            "lower(country) like '%paraguai%'"
                        )
                        ->orWhereRaw(
                            "lower(country) like '%paraguay%'"
                        );
                }
            )->count(),

            'pipeline' => $pipeline,

            'top_opportunities' => Opportunity::with(
                'company'
            )
                ->orderByDesc('score')
                ->orderByDesc('potential_value')
                ->limit(8)
                ->get(),

            'next_activities' => Activity::with([
                'company',
                'opportunity',
            ])
                ->whereNotIn(
                    'status',
                    $finishedActivityStatuses
                )
                ->whereNotNull('scheduled_at')
                ->where(
                    'scheduled_at',
                    '>=',
                    now()
                )
                ->orderBy('scheduled_at')
                ->limit(6)
                ->get(),

            'recent_evidences' => Evidence::with([
                'company',
                'opportunity',
            ])
                ->orderByDesc('published_at')
                ->orderByDesc('id')
                ->limit(6)
                ->get(),

            'urgent_bid_list' => Bid::whereNotIn(
                'status',
                $finishedBidStatuses
            )
                ->whereNotNull('deadline_at')
                ->whereBetween(
                    'deadline_at',
                    [$today, $sevenDays]
                )
                ->orderBy('deadline_at')
                ->limit(5)
                ->get(),
        ];
    }
}
