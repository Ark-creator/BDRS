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
        // Fetch all document types from the database
        $documentTypes = DocumentType::all();

        // Pass them as a prop to your Inertia component
        return Inertia::render('Residents/Home', [
            'documentTypes' => $documentTypes,
        ]);
    }
}