require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('Testing Resend API...\n');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'xsreeramx@gmail.com',
  subject: 'FollowersBoost Email Test ✅',
  html: '<h1>Success!</h1><p>Your email system is working!</p>',
}).then(result => {
  console.log('SUCCESS!');
  console.log('Full result:', JSON.stringify(result, null, 2));
  if (result.data) {
    console.log('\n✅ Email ID:', result.data.id);
  }
  if (result.error) {
    console.log('\n❌ Error:', result.error);
  }
}).catch(error => {
  console.log('ERROR!');
  console.log('Full error:', JSON.stringify(error, null, 2));
  console.log('Error message:', error.message);
  console.log('Error name:', error.name);
});
