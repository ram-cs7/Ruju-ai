import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    // If no secret is set, we will still process it for local testing, 
    // but in production this must be secure.
    console.warn("⚠️ CLERK_WEBHOOK_SECRET is not set. Webhook is unverified.");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt;

  if (WEBHOOK_SECRET && svix_id && svix_timestamp && svix_signature) {
    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new Response('Error occured', {
        status: 400
      });
    }
  } else {
    // Fallback for local testing if Svix headers/secret are missing
    evt = payload;
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    console.log(`Webhook: New user created with ID ${id}`);
    
    // Extract primary email address
    const emailObj = evt.data.email_addresses?.find(
      email => email.id === evt.data.primary_email_address_id
    ) || evt.data.email_addresses?.[0];
    
    const email = emailObj?.email_address;
    const firstName = evt.data.first_name || 'there';

    if (email && process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Ruju.ai <welcome@ruju.ai>',
          to: [email],
          subject: 'Welcome to Ruju.ai - The Anti-Hallucination Engine',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #0f172a;">
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a; margin: 0;">
                  <span style="color: #2563eb;">Ruju</span>.ai
                </h1>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-top: 5px;">The Anti-Hallucination Engine</p>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px;">
                <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; color: #0f172a;">Welcome aboard, ${firstName}!</h2>
                
                <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                  Thank you for joining Ruju.ai. We built this platform because professionals like you cannot afford to rely on AI tools that hallucinate facts.
                </p>
                
                <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                  With Ruju.ai, every single claim is strictly verified against your raw source documents. No assumptions. No lies. Just the raw, highlighted truth.
                </p>

                <div style="margin: 30px 0; text-align: center;">
                  <a href="https://ruju.ai" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);">
                    Start Verifying Documents
                  </a>
                </div>

                <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                  If you have any questions or need support, just reply to this email. We're here to help!
                </p>
              </div>

              <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                  © ${new Date().getFullYear()} Ruju.ai. All rights reserved.
                </p>
              </div>

            </div>
          `
        });

        if (error) {
          console.error("Failed to send welcome email via Resend:", error);
        } else {
          console.log(`Welcome email successfully sent to ${email} (ID: ${data.id})`);
        }
      } catch (err) {
        console.error("Resend API Exception:", err);
      }
    } else {
      console.log("Skipping email send. No RESEND_API_KEY found or no valid email attached to user.");
    }
  }

  return new Response('', { status: 200 });
}
