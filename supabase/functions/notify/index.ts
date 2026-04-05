// supabase/functions/notify/index.ts
import { Resend } from 'npm:resend@4';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'AIPS Launchpad <noreply@aips.club>';

Deno.serve(async (req) => {
  try {
    const { project_name, contact_email, status, feedback, total_score } = await req.json();

    if (!contact_email || !project_name || !status) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    let subject: string;
    let html: string;

    if (status === 'approved') {
      subject = `Your project "${project_name}" has been approved!`;
      html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #2DB757;">Congratulations! 🎉</h2>
          <p>Your project <strong>${project_name}</strong> scored <strong>${total_score}/100</strong> and has been approved by the AIPS committee.</p>
          <p>It's now live on the AIPS Launchpad board. Others can browse it and apply to join your team.</p>
          <p style="color: #86868b; font-size: 13px;">— AIPS Committee</p>
        </div>
      `;
    } else if (status === 'revision') {
      subject = `Your project "${project_name}" needs some changes`;
      html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Feedback on ${project_name}</h2>
          <p>The AIPS committee has reviewed your submission and has some feedback:</p>
          <div style="background: #f5f5f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;">${feedback || 'No specific feedback provided.'}</p>
          </div>
          <p>Please revise your submission and resubmit through the Launchpad.</p>
          <p style="color: #86868b; font-size: 13px;">— AIPS Committee</p>
        </div>
      `;
    } else {
      return new Response(JSON.stringify({ error: 'Unknown status' }), { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [contact_email],
      subject,
      html,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
