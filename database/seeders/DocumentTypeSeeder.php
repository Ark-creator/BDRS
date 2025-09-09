<?php

namespace Database\Seeders;

use App\Models\Barangay;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define the standard list of document templates
        $documentTypes = [
            ['name' => 'Solo Parent', 'description' => 'A certificate for Solo Parent.', 'template_path' => 'templates/akap.blade.php'],
            ['name' => 'Barangay Clearance', 'description' => 'A clearance from the barangay office.', 'template_path' => 'templates/brgy_clearance.blade.php'],
            ['name' => 'PWD Certificate', 'description' => 'A certificate for a Person with Disability.', 'template_path' => 'templates/pwd_certificate.blade.php'],
            ['name' => 'GP Indigency', 'description' => 'A certificate of indigency for General Purposes.', 'template_path' => 'templates/gp_indigency.blade.php'],
            ['name' => 'Residency', 'description' => 'A certificate proving barangay residency.', 'template_path' => 'templates/cert_residency.blade.php'],
            ['name' => 'Certificate of Indigency', 'description' => 'A certificate of indigency.', 'template_path' => 'templates/cert_indigency.blade.php'],
            ['name' => 'Brgy Business Permit', 'description' => 'A certificate of Brgy Business Permit.', 'template_path' => 'templates/brgy_business_permit.blade.php'],
            ['name' => 'Pagpapatunay Eduk', 'description' => 'A certificate of educational attainment verification.', 'template_path' => 'templates/pagpapatunay_eduk.docx'],
        ];

        // Get all the barangays we created in the BarangaySeeder
        $barangays = Barangay::all();
        $dataToInsert = [];

        // Loop through each barangay
        foreach ($barangays as $barangay) {
            // For each barangay, prepare the list of documents and add their specific barangay_id
            foreach ($documentTypes as $docType) {
                $dataToInsert[] = [
                    'name' => $docType['name'],
                    'description' => $docType['description'],
                    'template_path' => $docType['template_path'],
                    'barangay_id' => $barangay->id, // <-- This is the crucial part
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        
        // Use a single query to insert all the generated records for better performance
        if (!empty($dataToInsert)) {
            DB::table('document_types')->insert($dataToInsert);
        }
    }
}
