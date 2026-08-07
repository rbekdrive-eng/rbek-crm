<?php

namespace App\Http\Controllers\Api;

use App\Models\Company;
use App\Services\CompanyScoreService;
use Illuminate\Http\Request;

class CompanyController extends CrudController
{
    protected string $model = Company::class;

    protected array $rules = [
        'trade_name' => 'required|string|max:255',
        'legal_name' => 'nullable|string|max:255',
        'external_id' => 'nullable|string|max:100',
        'document' => 'nullable|string|max:100',
        'country' => 'nullable|string|max:100',
        'state' => 'nullable|string|max:100',
        'city' => 'nullable|string|max:100',
        'segment' => 'nullable|string|max:150',
        'website' => 'nullable|string|max:255',
        'priority' => 'required|string|max:30',
        'status' => 'required|string|max:30',
        'score' => 'required|integer|min:0|max:100',
        'notes' => 'nullable|string',
        'last_update' => 'nullable|date',
    ];

    protected array $searchable = [
        'trade_name',
        'legal_name',
        'city',
        'segment',
    ];

    protected array $with = [];

    public function recalculate(
        int $id,
        CompanyScoreService $scoreService
    ) {
        $company = Company::findOrFail($id);

        $company = $scoreService->recalculate(
            $company
        );

        return [
            'company' => $company,
            'score' => $scoreService->calculate(
                $company
            ),
        ];
    }

    public function recalculateAll(
        CompanyScoreService $scoreService
    ) {
        $updated = 0;

        Company::query()
            ->orderBy('id')
            ->chunkById(
                100,
                function ($companies) use (
                    $scoreService,
                    &$updated
                ) {
                    foreach ($companies as $company) {
                        $scoreService->recalculate(
                            $company
                        );

                        $updated++;
                    }
                }
            );

        return [
            'updated' => $updated,
            'message' => 'Scores recalculados com sucesso.',
        ];
    }
}
