/**
 * Direct Email Test
 * Tests Resend API directly
 */

require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

const testEmail = process.argv[2] || 'admin@followersboost.com';

console.log('🧪 Testing Resend email delivery...');
console.log('📧 Sending to:', testEmail);
console.log('🔑 API Key:', process.env.RESEND_API_KEY ? 'CONFIGURED ✓' : 'MISSING ✗');
console.log('');

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in environment');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  try {
    console.log('📤 Sending test email via Resend API...');

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: testEmail,
      subject: 'FollowersBoost - Email System Test ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 32px;">FollowersBoost</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Email System Test Successful! 🎉</h2>

            <p style="color: #374151; font-size: 16px; line-height: 24px;">
              This is a test email from your FollowersBoost application. If you're seeing this,
              your email system is working perfectly!
            </p>

            <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #047857; font-weight: 600;">
                ✓ Resend API: Connected<br>
                ✓ Email Templates: Ready<br>
                ✓ Delivery: Working
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Your application is now ready to send:
            </p>
            <ul style="color: #374151;">
              <li>Order confirmations</li>
              <li>Order status updates</li>
              <li>Wallet deposit notifications</li>
              <li>And more...</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/dashboard"
                 style="background: #4F46E5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>FollowersBoost Email System Test</p>
            <p>Powered by Resend</p>
          </div>
        </div>
      `,
    });

    console.log('');
    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', result.id);
    console.log('');
    console.log('📬 Check your inbox at:', testEmail);
    console.log('⏳ Email should arrive within 1-2 minutes');
    console.log('');
    console.log('🔍 You can also check the Resend dashboard:');
    console.log('   https://resend.com/emails/' + result.id);

  } catch (error) {
    console.error('');
    console.error('❌ Failed to send email:');
    console.error('   Error:', error.message);

    if (error.message.includes('API key')) {
      console.error('');
      console.error('💡 API Key issue detected:');
      console.error('   - Check that RESEND_API_KEY is correct in .env.local');
      console.error('   - Get a new key from: https://resend.com/api-keys');
    }

    process.exit(1);
  }
}

sendTestEmail();
