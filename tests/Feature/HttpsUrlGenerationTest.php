<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class HttpsUrlGenerationTest extends TestCase
{
    public function test_trusted_proxy_proto_generates_https_urls(): void
    {
        Route::get('/proxy-url-check', fn () => [
            'url' => url('/admin/request'),
        ]);

        $this->withServerVariables([
            'HTTP_HOST' => 'sg.bdrs.its-au.space',
            'HTTP_X_FORWARDED_HOST' => 'sg.bdrs.its-au.space',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'REMOTE_ADDR' => '10.0.0.1',
        ])
            ->get('/proxy-url-check')
            ->assertOk()
            ->assertJson([
                'url' => 'https://sg.bdrs.its-au.space/admin/request',
            ]);
    }
}
