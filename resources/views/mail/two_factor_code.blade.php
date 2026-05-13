@component('mail::layout')
{{-- Header with Logo --}}
@slot('header')
<div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
<img src="{{ asset('images/doconnect.png') }}" alt="{{ config('app.name') }}" style="height: 50px; margin: 0 auto; display: block;">
</div>
@endslot

{{-- Main Content --}}
<div style="padding: 30px; background-color: #ffffff;">
<h1 style="color: #1e3a8a; font-size: 24px; font-weight: bold; margin-bottom: 10px; text-align: center;">
🔐 Your Security Code
</h1>

<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
Hi <strong style="color: #1e3a8a;">{{ $user->full_name ?: 'there' }}</strong>,
</p>

<p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
We received a request to sign in to <strong>{{ config('app.name') }}</strong>.
Use the one-time code below to complete your login.
</p>

{{-- Code Display Box --}}
<div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #2563eb; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
<p style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
Your Verification Code
</p>
<p style="color: #1e3a8a; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: monospace;">
{{ $code }}
</p>
</div>

{{-- Expiry Warning --}}
<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
<p style="color: #92400e; font-size: 14px; margin: 0;">
⏱️ <strong>This code expires in 10 minutes.</strong>
@if($expiresAt)
({{ $expiresAt->diffForHumans() }})
@endif
</p>
</div>

{{-- Security Notice --}}
<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin-top: 20px;">
<p style="color: #166534; font-size: 13px; margin: 0;">
🛡️ If you did not request this code, please ignore this email.
Your account is safe - do not share this code with anyone.
</p>
</div>
</div>

{{-- Footer --}}
@slot('footer')
<div style="background-color: #1e3a8a; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
<p style="color: #93c5fd; font-size: 12px; margin: 0;">
&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
</p>
<p style="color: #60a5fa; font-size: 11px; margin-top: 8px;">
This is an automated message. Please do not reply to this email.
</p>
</div>
@endslot
@endcomponent
