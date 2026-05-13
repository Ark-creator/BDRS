<?php

namespace App\Services\IdentityVerification;

use Illuminate\Http\UploadedFile;
use RuntimeException;

class AntivirusScanner
{
    public function assertClean(UploadedFile $file): void
    {
        if (!config('identity_verification.security.antivirus_enabled')) {
            return;
        }

        $host = (string) config('identity_verification.security.clamav_host', 'clamav');
        $port = (int) config('identity_verification.security.clamav_port', 3310);
        $timeout = (int) config('identity_verification.security.clamav_timeout_seconds', 10);

        $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);
        if (!$socket) {
            throw new RuntimeException("Unable to connect to antivirus scanner: {$errstr}", $errno);
        }

        stream_set_timeout($socket, $timeout);
        fwrite($socket, "zINSTREAM\0");

        $handle = fopen($file->path(), 'rb');
        while (!feof($handle)) {
            $chunk = fread($handle, 8192);
            fwrite($socket, pack('N', strlen($chunk)).$chunk);
        }

        fclose($handle);
        fwrite($socket, pack('N', 0));
        $response = stream_get_contents($socket);
        fclose($socket);

        if (str_contains((string) $response, 'FOUND')) {
            throw new RuntimeException('Uploaded verification file failed antivirus scanning.');
        }

        if (!str_contains((string) $response, 'OK')) {
            throw new RuntimeException('Antivirus scanner returned an unexpected response.');
        }
    }
}
