<?php

// app/Http/Controllers/Admin/HistoryController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImmutableDocumentsArchiveHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function index()
    {
        $archives = ImmutableDocumentsArchiveHistory::with(['user.profile', 'documentType', 'processor.profile'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Admin/History', [
            'archives' => $archives,
        ]);
    }
}