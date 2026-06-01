interface ResultsEmailProps {
  firefighterName: string
  riskLevel: 'Low' | 'Moderate' | 'High'
  weakAreas: string[]
  totalScore: number
  appLink: string
  schedulingLink?: string
}

export function buildResultsEmailHtml({
  firefighterName,
  riskLevel,
  weakAreas,
  totalScore,
  appLink,
  schedulingLink = 'https://summitchiroandsports.com/schedule',
}: ResultsEmailProps): string {
  const riskColor =
    riskLevel === 'Low' ? '#22c55e' : riskLevel === 'Moderate' ? '#eab308' : '#ef4444'
  const riskBg =
    riskLevel === 'Low' ? '#f0fdf4' : riskLevel === 'Moderate' ? '#fefce8' : '#fef2f2'
  const riskBorder =
    riskLevel === 'Low' ? '#bbf7d0' : riskLevel === 'Moderate' ? '#fef08a' : '#fecaca'

  const weakAreasList = weakAreas.length > 0
    ? weakAreas.map(area => `<li style="margin-bottom:6px;color:#374151;">${area}</li>`).join('')
    : '<li style="color:#374151;">No significant movement limitations identified</li>'

  const showScheduling = riskLevel === 'Moderate' || riskLevel === 'High'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your FMS Results</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Your Results Are In</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Take the Next Step in Your Performance</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;color:#1f2937;font-size:16px;line-height:1.6;">
                Dear ${firefighterName},
              </p>
              <p style="margin:16px 0 0;color:#374151;font-size:15px;line-height:1.6;">
                Thank you for completing your Functional Movement Screen (FMS). This is a critical first step in understanding how your body moves and how we can help you stay strong, resilient, and injury-free throughout your career.
              </p>
            </td>
          </tr>

          <!-- Score Card -->
          <tr>
            <td style="padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${riskBg};border:1px solid ${riskBorder};border-radius:8px;">
                <tr>
                  <td style="padding:24px;">
                    <h2 style="margin:0 0 16px;color:#1f2937;font-size:18px;font-weight:700;">Your Results</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Risk Level</span><br>
                          <span style="color:${riskColor};font-size:20px;font-weight:700;">${riskLevel} Risk of Injury</span>
                        </td>
                        <td align="right" style="padding-bottom:12px;">
                          <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">FMS Score</span><br>
                          <span style="color:${riskColor};font-size:28px;font-weight:700;">${totalScore}</span>
                          <span style="color:#9ca3af;font-size:14px;">/21</span>
                        </td>
                      </tr>
                    </table>
                    <div style="border-top:1px solid ${riskBorder};padding-top:16px;margin-top:4px;">
                      <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Key Areas for Improvement</span>
                      <ul style="margin:8px 0 0;padding-left:20px;font-size:15px;">
                        ${weakAreasList}
                      </ul>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What This Means -->
          <tr>
            <td style="padding:0 40px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;font-weight:700;">What This Means</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Your results are not a limitation—they are a <strong>starting point</strong>.
                They give you clear insight into where your body may be at risk and, more importantly, exactly what you can do to improve it.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 16px;background-color:#f0fdf4;border-left:3px solid #22c55e;border-radius:4px;margin-bottom:8px;">
                    <span style="color:#166534;font-size:14px;"><strong>Low Risk:</strong> You're moving well—now it's about maintaining and optimizing performance.</span>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:10px 16px;background-color:#fefce8;border-left:3px solid #eab308;border-radius:4px;">
                    <span style="color:#854d0e;font-size:14px;"><strong>Moderate Risk:</strong> There are a few areas that need attention to prevent future injury.</span>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:10px 16px;background-color:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;">
                    <span style="color:#991b1b;font-size:14px;"><strong>High Risk:</strong> There are significant movement limitations that increase your likelihood of injury if not addressed.</span>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;color:#374151;font-size:15px;line-height:1.6;">
                No matter where you fall, you now have something most people don't—a <strong>clear, data-driven plan to improve</strong>.
              </p>
            </td>
          </tr>

          <!-- Your Personalized Plan -->
          <tr>
            <td style="padding:0 40px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;font-weight:700;">Your Next Step: Your Personalized Plan</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Based on your results, you have unlocked a customized mobility and corrective exercise program inside the Tactical Athlete App.
              </p>
              <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">This program is built specifically for you to:</p>
              <ul style="margin:0;padding-left:20px;color:#374151;font-size:15px;line-height:1.8;">
                <li>Correct asymmetries and movement restrictions</li>
                <li>Improve mobility and stability</li>
                <li>Reduce your risk of injury</li>
                <li>Enhance performance on the job</li>
              </ul>
            </td>
          </tr>

          <!-- This Only Works If You Use It -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h3 style="margin:0 0 8px;color:#1e40af;font-size:16px;font-weight:700;">Important: This Only Works If You Use It</h3>
                    <p style="margin:0 0 12px;color:#1e3a5f;font-size:14px;line-height:1.6;">
                      This program is only effective if you take action. The firefighters who stay consistent with their assigned protocols are the ones who:
                    </p>
                    <ul style="margin:0 0 12px;padding-left:20px;color:#1e3a5f;font-size:14px;line-height:1.8;">
                      <li>Move better</li>
                      <li>Feel better</li>
                      <li>Perform better</li>
                      <li>Stay injury-free</li>
                    </ul>
                    <p style="margin:0;color:#1e3a5f;font-size:14px;line-height:1.6;">
                      If you don't use the app and follow your program, nothing changes.<br>
                      If you do—<strong>you put yourself in control of your performance and longevity.</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${showScheduling ? `
          <!-- Scheduling CTA (Moderate & High Risk Only) -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${riskBg};border:1px solid ${riskBorder};border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h3 style="margin:0 0 8px;color:#1f2937;font-size:16px;font-weight:700;">Recommended Next Step (${riskLevel} Risk)</h3>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
                      Because you are classified as <strong>${riskLevel} Risk</strong>, we strongly recommend scheduling a visit with Summit Chiropractic &amp; Sports Institute for a more in-depth evaluation.
                    </p>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">During this visit, we will:</p>
                    <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
                      <li>Identify the root cause of your movement limitations</li>
                      <li>Provide a targeted diagnosis</li>
                      <li>Build a structured treatment plan using our proven system:</li>
                    </ul>
                    <p style="margin:0 0 16px;color:#374151;font-size:15px;text-align:center;font-weight:600;">
                      Analyze &rarr; Mobilize &rarr; Stabilize &rarr; Optimize
                    </p>
                    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
                      Our goal is to help you move out of risk and into performance as efficiently as possible.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="background-color:${riskColor};border-radius:8px;">
                          <a href="${schedulingLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">
                            Schedule Your Visit
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Summit Partnership -->
          <tr>
            <td style="padding:0 40px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;font-weight:700;">Your Partner in Performance &amp; Health</h2>
              <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">
                Summit Chiropractic &amp; Sports Institute is proud to be a partner with Spokane Valley Fire Department, providing you with priority access to care. Whether you're dealing with discomfort, a current injury, a new on-the-job injury, or simply want to stay ahead with proactive maintenance, our team is here for you. We will get you scheduled within 24–48 hours during weekdays.
              </p>
              <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">
                We are not a "quick adjustment" or "pop-and-go" clinic—we take a comprehensive, performance-based approach that includes movement analysis, soft tissue therapy, corrective exercise, mobility work, and strength progression to address the root cause of issues, not just symptoms.
              </p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">
                Led by <strong>Dr. Asdrubal Lopez</strong>, founder and sports chiropractor for Team USA Track &amp; Field, including the Olympic Games, our clinic brings world-class, athlete-level care directly to tactical athletes like you.
              </p>
            </td>
          </tr>

          <!-- You're In Control -->
          <tr>
            <td style="padding:0 40px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;font-weight:700;">You're in Control</h2>
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                You now have the awareness, the tools, and the plan.<br>
                What you do next is what determines the outcome.
              </p>
              <p style="margin:16px 0 0;color:#1f2937;font-size:15px;font-weight:600;line-height:1.6;">
                Stay consistent. Stay proactive. Stay ready.
              </p>
              <p style="margin:8px 0 0;color:#374151;font-size:15px;line-height:1.6;">
                We're here to support you every step of the way.
              </p>
            </td>
          </tr>

          <!-- Login CTA -->
          <tr>
            <td style="padding:0 40px 16px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background-color:#2563eb;border-radius:8px;">
                    <a href="${appLink}" target="_blank" style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;">
                      Log In to Your Account
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
                First time logging in? Click <strong>Forgot Password</strong> on the login page to set your password.
              </p>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                Best regards,<br>
                <strong>Dr. Asdrubal Lopez, DC, DACBSP</strong><br>
                <span style="color:#6b7280;">Summit Chiropractic &amp; Sports Institute</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Summit Chiropractic &amp; Sports Institute<br>
                Spokane Valley Fire Department Tactical Athlete Program
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildResultsEmailText({
  firefighterName,
  riskLevel,
  weakAreas,
  totalScore,
  appLink,
  schedulingLink = 'https://summitchiroandsports.com/schedule',
}: ResultsEmailProps): string {
  const weakAreasList = weakAreas.length > 0
    ? weakAreas.map(area => `  • ${area}`).join('\n')
    : '  • No significant movement limitations identified'

  const showScheduling = riskLevel === 'Moderate' || riskLevel === 'High'

  return `Your Results Are In – Take the Next Step in Your Performance

Dear ${firefighterName},

Thank you for completing your Functional Movement Screen (FMS). This is a critical first step in understanding how your body moves and how we can help you stay strong, resilient, and injury-free throughout your career.

YOUR RESULTS
Risk Level: ${riskLevel} Risk of Injury
FMS Score: ${totalScore}/21

Key Areas for Improvement:
${weakAreasList}

WHAT THIS MEANS
Your results are not a limitation—they are a starting point.

They give you clear insight into where your body may be at risk and, more importantly, exactly what you can do to improve it.

Low Risk: You're moving well—now it's about maintaining and optimizing performance.
Moderate Risk: There are a few areas that need attention to prevent future injury.
High Risk: There are significant movement limitations that increase your likelihood of injury if not addressed.

No matter where you fall, you now have something most people don't—a clear, data-driven plan to improve.

YOUR NEXT STEP: YOUR PERSONALIZED PLAN
Based on your results, you have unlocked a customized mobility and corrective exercise program inside the Tactical Athlete App.

This program is built specifically for you to:
  • Correct asymmetries and movement restrictions
  • Improve mobility and stability
  • Reduce your risk of injury
  • Enhance performance on the job

IMPORTANT: THIS ONLY WORKS IF YOU USE IT
This program is only effective if you take action. The firefighters who stay consistent with their assigned protocols are the ones who move better, feel better, perform better, and stay injury-free.

If you don't use the app and follow your program, nothing changes.
If you do—you put yourself in control of your performance and longevity.
${showScheduling ? `
RECOMMENDED NEXT STEP (${riskLevel.toUpperCase()} RISK)
Because you are classified as ${riskLevel} Risk, we strongly recommend scheduling a visit with Summit Chiropractic & Sports Institute for a more in-depth evaluation.

During this visit, we will:
  • Identify the root cause of your movement limitations
  • Provide a targeted diagnosis
  • Build a structured treatment plan: Analyze → Mobilize → Stabilize → Optimize

Schedule your visit here: ${schedulingLink}
` : ''}
YOUR PARTNER IN PERFORMANCE & HEALTH
Summit Chiropractic & Sports Institute is proud to be a partner with Spokane Valley Fire Department, providing you with priority access to care. We will get you scheduled within 24–48 hours during weekdays.

Led by Dr. Asdrubal Lopez, founder and sports chiropractor for Team USA Track & Field, including the Olympic Games.

YOU'RE IN CONTROL
You now have the awareness, the tools, and the plan.
What you do next is what determines the outcome.

Stay consistent. Stay proactive. Stay ready.

LOG IN TO YOUR ACCOUNT: ${appLink}
(First time? Click "Forgot Password" on the login page to set your password.)

Best regards,
Dr. Asdrubal Lopez, DC, DACBSP
Summit Chiropractic & Sports Institute`
}
