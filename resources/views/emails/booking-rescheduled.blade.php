<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Consultation Rebooked — RMTY Designs</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;padding:48px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

    {{-- Wordmark --}}
    <tr>
        <td style="padding-bottom:16px;text-align:center;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.25em;color:#888;text-transform:uppercase;">RMTY Designs Studio</span>
        </td>
    </tr>

    {{-- Card --}}
    <tr>
        <td style="background-color:#ffffff;border:1px solid #e5e5e5;overflow:hidden;">

            {{-- Black header --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="background-color:#000000;padding:30px 40px;">
                        <p style="margin:0 0 5px 0;font-size:10px;font-weight:700;letter-spacing:0.2em;color:#666;text-transform:uppercase;">Consultation Rebooked</p>
                        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;line-height:1.25;">Your session has been rebooked.</h1>
                    </td>
                </tr>
            </table>

            {{-- Thin blue status strip --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="background-color:#eff6ff;border-bottom:1px solid #bfdbfe;padding:11px 40px;">
                        <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:#1d4ed8;text-transform:uppercase;">&#8635;&nbsp;&nbsp;Rescheduled</span>
                    </td>
                </tr>
            </table>

            {{-- Body --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding:34px 40px 0 40px;">

                        <p style="margin:0 0 5px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#aaa;text-transform:uppercase;">Hi,</p>
                        <p style="margin:0 0 20px 0;font-size:20px;font-weight:800;color:#111;letter-spacing:-0.02em;">{{ $clientName }}.</p>

                        <p style="margin:0 0 26px 0;font-size:14px;line-height:1.75;color:#555;">
                            Your architecture consultation with <strong style="color:#111;">RMTY Designs</strong> has been successfully rebooked. We look forward to meeting with you and discussing your project at the new time.
                        </p>

                        {{-- Updated details --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e8e8;margin-bottom:22px;">
                            <tr>
                                <td style="background-color:#f9f9f9;padding:12px 20px;border-bottom:1px solid #e8e8e8;">
                                    <span style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#999;text-transform:uppercase;">Updated Appointment Details</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 20px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaa;text-transform:uppercase;width:38%;">New Date</td>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:13px;font-weight:600;color:#111;text-align:right;">{{ $consultationDate }}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaa;text-transform:uppercase;">New Time</td>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:13px;font-weight:600;color:#111;text-align:right;">{{ $consultationTime }}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaa;text-transform:uppercase;">Project Type</td>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:13px;font-weight:600;color:#111;text-align:right;">{{ $projectType }}</td>
                                        </tr>
                                        {{-- Consultation Type --}}
                                        <tr>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaa;text-transform:uppercase;">Consultation Type</td>
                                            <td style="padding:12px 0;border-bottom:1px solid #f2f2f2;font-size:13px;font-weight:600;color:#111;text-align:right;">
                                                @if(!empty($consultationType) && strtolower($consultationType) === 'online')
                                                    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#6d28d9;text-transform:uppercase;background-color:#f5f3ff;padding:4px 12px;border-radius:99px;border:1px solid #ddd6fe;">&#127909;&nbsp; Online</span>
                                                @else
                                                    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#0f766e;text-transform:uppercase;background-color:#f0fdfa;padding:4px 12px;border-radius:99px;border:1px solid #99f6e4;">&#128205;&nbsp; On-site</span>
                                                @endif
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaa;text-transform:uppercase;">Status</td>
                                            <td style="padding:12px 0;text-align:right;">
                                                <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#1d4ed8;text-transform:uppercase;background-color:#eff6ff;padding:4px 12px;border-radius:99px;border:1px solid #bfdbfe;">Rebooked</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        {{-- Location / Zoom block — conditional on consultation type --}}
                        @if(!empty($consultationType) && strtolower($consultationType) === 'online')

                            {{-- Online / Zoom notice --}}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
                                <tr>
                                    <td style="background-color:#f5f3ff;border-left:3px solid #7c3aed;padding:14px 18px;">
                                        <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;letter-spacing:0.15em;color:#7c3aed;text-transform:uppercase;">&#127909;&nbsp; Online Consultation via Zoom</p>
                                        <p style="margin:0 0 10px 0;font-size:13px;line-height:1.65;color:#4c1d95;">
                                            This appointment will be held <strong>online</strong>. Please join using the Zoom link below at the scheduled time.
                                        </p>
                                        @if(!empty($zoomLink))
                                            <a href="{{ $zoomLink }}" style="display:inline-block;font-size:12px;font-weight:700;color:#7c3aed;word-break:break-all;text-decoration:underline;">{{ $zoomLink }}</a>
                                        @else
                                            <p style="margin:0;font-size:12px;color:#7c3aed;font-style:italic;">Your Zoom link will be shared with you shortly. Please check your email or contact us if you have not received it before the session.</p>
                                        @endif
                                    </td>
                                </tr>
                            </table>

                        @else

                            {{-- Onsite notice --}}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
                                <tr>
                                    <td style="background-color:#f9f9f9;border-left:3px solid #000;padding:14px 18px;">
                                        <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;letter-spacing:0.15em;color:#888;text-transform:uppercase;">&#128205;&nbsp; Onsite Appointment</p>
                                        <p style="margin:0;font-size:13px;line-height:1.65;color:#333;">
                                            This appointment will be held <strong>onsite</strong> at our studio.<br>
                                            911 Josefina 2 Sampaloc, Manila, Philippines 1008<br>
                                            (+63) 915 896 2275
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        @endif

                        @if(!empty($rescheduleReason))
                        {{-- Reschedule reason --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
                            <tr>
                                <td style="background-color:#eff6ff;border-left:3px solid #1d4ed8;padding:14px 18px;">
                                    <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;letter-spacing:0.15em;color:#1d4ed8;text-transform:uppercase;">Reason for Rescheduling</p>
                                    <p style="margin:0;font-size:13px;line-height:1.65;color:#1e3a8a;">{{ $rescheduleReason }}</p>
                                </td>
                            </tr>
                        </table>
                        @endif

                        <p style="margin:0 0 22px 0;font-size:14px;line-height:1.75;color:#555;">
                            If you need to make further changes, you can manage your booking here:
                        </p>

                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                            <tr>
                                <td style="background-color:#000;">
                                    <a href="{{ $dashboardUrl }}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#fff;text-decoration:none;text-transform:uppercase;">Manage My Booking</a>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

            {{-- Footer --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="border-top:1px solid #ebebeb;background-color:#fafafa;padding:24px 40px;">
                        <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#333;">Warm regards, RMTY Designs Studio</p>
                        <p style="margin:0 0 12px 0;font-size:12px;color:#888;line-height:1.65;">
                            (+63) 915 896 2275<br>
                            911 Josefina 2 Sampaloc, Manila, Philippines 1008
                        </p>
                        <p style="margin:0;font-size:11px;color:#bbb;">© {{ date('Y') }} RMTY Designs Studio. All rights reserved.</p>
                    </td>
                </tr>
            </table>

        </td>
    </tr>

</table>
</td></tr>
</table>

</body>
</html>