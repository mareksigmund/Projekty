<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

 'mockbank' => [
        'base_url'        => env('MOCKBANK_BASE_URL', 'https://mockbank-iaco.onrender.com'),
        'webhook_secret'  => env('MOCKBANK_WEBHOOK_SECRET', ''),
        'default_user_id' => (int) env('MOCKBANK_DEFAULT_USER_ID', 1), // <— DODANE
        'timeout'         => env('MOCKBANK_HTTP_TIMEOUT', 20),
        'rate_limit'      => env('MOCKBANK_RATE_LIMIT', 100),
    ],


];
