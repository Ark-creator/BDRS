<?php
// app/Http/Controllers/Resident/HomeController.php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __invoke()
    {
        // Fetch only the document types that are NOT archived
        $documentTypes = DocumentType::where('is_archived', false)->get();

        // Pass them as a prop to your Inertia component
        return Inertia::render('Residents/Home', [
            'documentTypes' => $documentTypes,
        ]);
    }
}