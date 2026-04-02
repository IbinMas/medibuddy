import { config } from 'dotenv';
import axios from 'axios';
import path from 'path';

// Load .env from root or backend
config({ path: path.join(__dirname, '../.env') });

async function run() {
  const phone = '233598402862'; // Your hardcoded number
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log(`Testing WhatsApp API...`);
  console.log(`Phone ID: ${phoneNumberId}`);
  console.log(`Access Token: ${accessToken ? 'Found ✅' : 'Missing ❌'}`);
  
  if (!phoneNumberId || !accessToken) {
    console.log('Cannot proceed without credentials in .env');
    return;
  }

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    
    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME || 'prescription_notification',
        language: { code: 'en_US' }, // Updated to en_US!
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'MediBuddy Pharmacy' },
              { type: 'text', text: 'Kwasi' },
              { type: 'text', text: 'Amoxicillin' },
              { type: 'text', text: '1 Capsule' },
              { type: 'text', text: 'Twice daily' },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, templatePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('\n✅ Message sent successfully!');
    console.log(response.data);
  } catch (err: any) {
    console.error('\n❌ Error sending message:');
    console.error(JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

run();
