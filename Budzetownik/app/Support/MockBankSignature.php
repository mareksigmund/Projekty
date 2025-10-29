<?php

namespace App\Support;

class MockBankSignature
{
    public static function verify(string $secret, string $rawBody, ?string $timestamp, ?string $headerSig): bool
    {
        if (!$secret || !$timestamp || !$headerSig) return false;

        // header format: "sha256=<hex>"
        $parts = explode('=', $headerSig, 2);
        if (count($parts) !== 2 || strtolower($parts[0]) !== 'sha256' || empty($parts[1])) {
            return false;
        }
        $sigHex = $parts[1];

        // stringToSign = "<timestamp>.<rawBody>"
        $stringToSign = "{$timestamp}.{$rawBody}";
        $expected = hash_hmac('sha256', $stringToSign, $secret);

        return hash_equals($expected, $sigHex);
    }
}
