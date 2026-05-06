@component('mail::message')
# Your security code

Hi {{ $user->full_name ?: 'there' }},

We received a request to sign in to {{ config('app.name') }}. Use the one-time code below to complete your login.

@component('mail::panel')
{{ $code }}
@endcomponent

@if($expiresAt)
This code expires {{ $expiresAt->diffForHumans() }}.
@else
This code expires in 10 minutes.
@endif

If you did not request this code, you can safely ignore this email.

Thanks,  
{{ config('app.name') }}
@endcomponent
