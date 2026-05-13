<?php

namespace App\Services\IdentityVerification;

use App\Models\Verification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class VerificationFileStorage
{
    public function __construct(private AntivirusScanner $antivirus) {}

    public function storeImage(Verification $verification, UploadedFile $file, string $type): array
    {
        if (!in_array($type, ['id', 'selfie'], true)) {
            throw new RuntimeException('Unsupported verification image type.');
        }

        $this->antivirus->assertClean($file);

        $metadata = $this->imageMetadata($file);
        $hash = hash_file('sha256', $file->path());
        [$contents, $extension] = $this->normalizeImage($file);

        $path = sprintf(
            '%s/%s/%s_%s.%s',
            trim((string) config('identity_verification.storage.root', 'verifications'), '/'),
            $verification->uuid,
            $type,
            bin2hex(random_bytes(8)),
            $extension
        );

        $stored = Storage::disk($this->disk())->put($path, $contents, ['visibility' => 'private']);

        if (!$stored) {
            throw new RuntimeException('Unable to store identity verification image.');
        }

        return [
            'path' => $path,
            'hash' => $hash,
            'metadata' => $metadata,
        ];
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk($this->disk())->delete($path);
        }
    }

    public function disk(): string
    {
        return (string) config('identity_verification.storage.disk', 's3-private');
    }

    private function imageMetadata(UploadedFile $file): array
    {
        $size = @getimagesize($file->path()) ?: [null, null, null, null, 'mime' => $file->getMimeType()];

        return [
            'width' => $size[0] ?? null,
            'height' => $size[1] ?? null,
            'mime' => $size['mime'] ?? $file->getMimeType(),
            'bytes' => $file->getSize(),
            'original_name' => $file->getClientOriginalName(),
        ];
    }

    private function normalizeImage(UploadedFile $file): array
    {
        $fallback = [file_get_contents($file->path()), $this->safeExtension($file)];

        if (!function_exists('imagecreatefromstring')) {
            return $fallback;
        }

        $source = @imagecreatefromstring(file_get_contents($file->path()));
        if (!$source) {
            return $fallback;
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $maxWidth = (int) config('identity_verification.uploads.max_width', 1920);

        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int) round($height * ($maxWidth / $width));
            $canvas = imagecreatetruecolor($newWidth, $newHeight);
        } else {
            $newWidth = $width;
            $newHeight = $height;
            $canvas = imagecreatetruecolor($width, $height);
        }

        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        ob_start();
        imagejpeg($canvas, null, (int) config('identity_verification.uploads.jpeg_quality', 82));
        $contents = ob_get_clean();

        imagedestroy($source);
        imagedestroy($canvas);

        return $contents ? [$contents, 'jpg'] : $fallback;
    }

    private function safeExtension(UploadedFile $file): string
    {
        $extension = strtolower($file->extension() ?: $file->getClientOriginalExtension() ?: 'jpg');

        return in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true) ? $extension : 'jpg';
    }
}
