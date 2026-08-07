<?php

namespace App\Services;

use App\Models\Company;
use Carbon\Carbon;

class CompanyScoreService
{
    public function calculate(Company $company): array
    {
        $company->loadMissing([
            'opportunities',
            'contacts',
            'activities',
            'works',
            'evidences',
        ]);

        $evidenceScore = $this->evidenceScore($company);
        $opportunityScore = $this->opportunityScore($company);
        $workScore = $this->workScore($company);
        $contactScore = $this->contactScore($company);
        $paraguayScore = $this->paraguayScore($company);
        $activityScore = $this->activityScore($company);

        $total =
            $evidenceScore +
            $opportunityScore +
            $workScore +
            $contactScore +
            $paraguayScore +
            $activityScore;

        $total = max(0, min(100, (int) round($total)));

        return [
            'score' => $total,
            'priority' => $this->priorityFromScore($total),

            'breakdown' => [
                'evidences' => $evidenceScore,
                'opportunities' => $opportunityScore,
                'works' => $workScore,
                'contacts' => $contactScore,
                'paraguay' => $paraguayScore,
                'activities' => $activityScore,
            ],
        ];
    }

    public function recalculate(Company $company): Company
    {
        $result = $this->calculate($company);

        $company->update([
            'score' => $result['score'],
            'priority' => $result['priority'],
            'last_update' => now(),
        ]);

        return $company->fresh();
    }

    private function evidenceScore(Company $company): int
    {
        $score = 0;

        foreach ($company->evidences as $evidence) {
            $confidence = max(
                0,
                min(100, (int) ($evidence->confidence ?? 0))
            );

            $impact = (int) ($evidence->score_impact ?? 0);

            if ($impact > 0) {
                $score += min(
                    8,
                    ($confidence / 100) * min($impact, 20)
                );
            }

            if ($confidence >= 80) {
                $score += 2;
            }

            if (
                $evidence->published_at &&
                Carbon::parse($evidence->published_at)
                    ->greaterThanOrEqualTo(now()->subDays(90))
            ) {
                $score += 1;
            }
        }

        return min(35, (int) round($score));
    }

    private function opportunityScore(Company $company): int
    {
        $score = 0;

        foreach ($company->opportunities as $opportunity) {
            if (
                in_array(
                    $opportunity->status,
                    ['Perdida'],
                    true
                )
            ) {
                continue;
            }

            if ($opportunity->status === 'Ganha') {
                $score += 5;
                continue;
            }

            $score += 3;

            $probability = (int) ($opportunity->probability ?? 0);

            if ($probability >= 70) {
                $score += 5;
            } elseif ($probability >= 40) {
                $score += 3;
            } elseif ($probability >= 20) {
                $score += 1;
            }

            $opportunityScore = (int) ($opportunity->score ?? 0);

            if ($opportunityScore >= 80) {
                $score += 4;
            } elseif ($opportunityScore >= 60) {
                $score += 2;
            }

            $potentialValue = (float) ($opportunity->potential_value ?? 0);

            if ($potentialValue >= 10000000) {
                $score += 4;
            } elseif ($potentialValue >= 1000000) {
                $score += 2;
            } elseif ($potentialValue > 0) {
                $score += 1;
            }

            if (
                $opportunity->next_step_at &&
                Carbon::parse($opportunity->next_step_at)
                    ->greaterThanOrEqualTo(now())
            ) {
                $score += 1;
            }
        }

        return min(25, $score);
    }

    private function workScore(Company $company): int
    {
        $score = 0;

        foreach ($company->works as $work) {
            $potential = mb_strtolower(
                (string) ($work->potential ?? '')
            );

            if ($potential === 'estratégico') {
                $score += 6;
            } elseif ($potential === 'alto') {
                $score += 4;
            } elseif ($potential === 'médio') {
                $score += 2;
            } elseif ($potential === 'baixo') {
                $score += 1;
            }

            $value = (float) ($work->contract_value ?? 0);

            if ($value >= 10000000) {
                $score += 3;
            } elseif ($value >= 1000000) {
                $score += 2;
            } elseif ($value > 0) {
                $score += 1;
            }
        }

        return min(15, $score);
    }

    private function contactScore(Company $company): int
    {
        $score = 0;

        foreach ($company->contacts as $contact) {
            $score += 1;

            if ($contact->decision_maker) {
                $score += 3;
            }

            if ($contact->email) {
                $score += 1;
            }

            if ($contact->phone) {
                $score += 1;
            }
        }

        return min(10, $score);
    }

    private function paraguayScore(Company $company): int
    {
        $haystack = mb_strtolower(
            implode(' ', [
                $company->country,
                $company->state,
                $company->city,
                $company->notes,
                $company->segment,
            ])
        );

        if (
            str_contains($haystack, 'paraguai') ||
            str_contains($haystack, 'paraguay')
        ) {
            return 10;
        }

        foreach ($company->evidences as $evidence) {
            $text = mb_strtolower(
                implode(' ', [
                    $evidence->title,
                    $evidence->description,
                    $evidence->source_type,
                ])
            );

            if (
                str_contains($text, 'paraguai') ||
                str_contains($text, 'paraguay') ||
                str_contains($text, 'maquila')
            ) {
                return 10;
            }
        }

        return 0;
    }

    private function activityScore(Company $company): int
    {
        $recentActivity = $company->activities
            ->filter(function ($activity) {
                return $activity->scheduled_at &&
                    Carbon::parse($activity->scheduled_at)
                        ->greaterThanOrEqualTo(now()->subDays(60));
            })
            ->count();

        if ($recentActivity >= 3) {
            return 5;
        }

        if ($recentActivity === 2) {
            return 4;
        }

        if ($recentActivity === 1) {
            return 2;
        }

        return 0;
    }

    private function priorityFromScore(int $score): string
    {
        if ($score >= 80) {
            return 'Alta';
        }

        if ($score >= 50) {
            return 'Média';
        }

        return 'Baixa';
    }
}
