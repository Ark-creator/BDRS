<?php

return [
    'domain' => env('HORIZON_DOMAIN'),
    'path' => env('HORIZON_PATH', 'horizon'),
    'use' => 'default',
    'prefix' => env('HORIZON_PREFIX', env('APP_NAME', 'laravel').'_horizon:'),
    'middleware' => ['web'],

    'waits' => [
        'database:default' => 60,
        'database:identity-verification' => 120,
    ],

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 10080,
        'monitored' => 10080,
    ],

    'fast_termination' => false,
    'memory_limit' => 256,

    'defaults' => [
        'identity-verification' => [
            'connection' => 'database',
            'queue' => ['identity-verification', 'default'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 3,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 256,
            'tries' => 3,
            'timeout' => 180,
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            'identity-verification' => [
                'maxProcesses' => 6,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
        ],
        'local' => [
            'identity-verification' => [
                'maxProcesses' => 2,
            ],
        ],
    ],
];
