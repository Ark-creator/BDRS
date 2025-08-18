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
        // Kunin ang lahat ng archived records kasama ang related data
        $archives = ImmutableDocumentsArchiveHistory::with(['user.profile', 'documentType'])
            ->latest() // Pagbukud-bukurin ayon sa pinakabago
            ->paginate(15); // Gumamit ng pagination

        return Inertia::render('Admin/History', [
            'archives' => $archives,
        ]);
    }
}