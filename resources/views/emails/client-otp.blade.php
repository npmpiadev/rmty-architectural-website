<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification OTP</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased;">

    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02);">

        {{-- ─── Header ─────────────────────────────────────────── --}}
        <div style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #f5f5f5;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.05em; color: #000000; text-transform: uppercase;">
                RMTY
            </h2>
            <p style="margin: 10px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #a3a3a3; text-transform: uppercase;">
                Email Verification
            </p>
        </div>

        {{-- ─── Body ───────────────────────────────────────────── --}}
        <div style="padding: 40px;">

            <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #171717;">
                Hello {{ $clientName }},
            </p>

            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #525252;">
                Thanks for creating a client profile with <strong>RMTY ADS</strong>. 
                Use the One-Time Password below to verify your email address and activate your account.
            </p>

            {{-- OTP Box --}}
<div style="background-color: #000000; border-radius: 16px; padding: 36px 30px; text-align: center; margin-bottom: 30px;">
    <p style="margin: 0 0 14px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #737373; text-transform: uppercase;">
        Your Verification Code
    </p>

    {{-- Individual digit boxes --}}
    <!-- Removed inline-flex and gap, relying on standard text-align instead -->
    <div style="text-align: center; margin-bottom: 16px;">
        @foreach(str_split($otp) as $digit)
        <div style="
            display: inline-block; /* Replaced inline-flex for email compatibility */
            width: 44px;
            height: 56px;
            background-color: #1a1a1a;
            border: 1px solid #333333;
            border-radius: 8px;
            font-size: 28px;
            font-weight: 900;
            color: #ffffff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            line-height: 56px; /* Perfectly centers the text vertically */
            text-align: center; /* Perfectly centers the text horizontally */
            margin: 0 4px; /* Replaces the 'gap' property from the parent */
            vertical-align: middle;
            box-sizing: border-box;
        ">{{ $digit }}</div>
        @endforeach
    </div>

    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #ef4444; letter-spacing: 0.05em; text-transform: uppercase;">
        ⏱ Expires in 5 minutes
    </p>
</div>

            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #525252;">
                Enter this code on the verification screen to complete your registration and book appointments with us.
            </p>

            {{-- Warning block --}}
            <div style="background-color: #fff1f2; border-left: 3px solid #e11d48; padding: 16px; margin-bottom: 16px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em;">
                    Important
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9f1239;">
                    If you didn't create this account, you can safely ignore this email. No action is required.
                </p>
            </div>

            {{-- Security tips --}}
            <div style="background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.05em;">
                    Security Tips
                </p>
                <ul style="margin: 0; padding-left: 16px; font-size: 13px; line-height: 1.8; color: #1e3a8a;">
                    <li>Never share this OTP with anyone.</li>
                    <li>Our team will never ask for your OTP.</li>
                    <li>This code can only be used once.</li>
                </ul>
            </div>
        </div>

        {{-- ─── Footer ─────────────────────────────────────────── --}}
        <div style="background-color: #fafafa; border-top: 1px solid #f5f5f5; padding: 30px 40px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #525252;">
                {{ config('app.name') }} // Client Portal
            </p>
            <p style="margin: 0 0 15px 0; font-size: 11px; color: #737373;">
                This is an automated message — please do not reply.
            </p>
            <p style="margin: 0; font-size: 10px; color: #a3a3a3; font-weight: 500;">
                &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>