const { config } = require('dotenv');
const axios = require('axios');
const path = require('path');

config({ path: path.join(__dirname, '../.env') });

async function run() {
  const phone = '233245724489'; 
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log('Testing WhatsApp API...');
  console.log('Phone ID:', phoneNumberId);
  console.log('Access Token:', accessToken ? 'Found ✅' : 'Missing ❌');
  
  if (!phoneNumberId || !accessToken) {
    console.log('Cannot proceed without credentials in .env');
    return;
  }

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    
    // Test the text payload as safety fallback if template is unapproved
    const fallbackPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: { body: 'This is a test notification from MediBuddy Pharmacy!\nMedication: Amoxicillin\nDosage: 1 Capsule\nFrequency: Twice daily' }
    };

    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME || 'detailed_prescription',
        language: { code: 'en' }, 
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Kwasi Ofori' },
              { type: 'text', text: 'MediBuddy Pharmacy' },
              { type: 'text', text: 'Amoxicillin 500mg' },
              { type: 'text', text: '1 Capsule' },
              { type: 'text', text: 'Twice daily' },
              { type: 'text', text: 'Before Meal' },
              { type: 'text', text: '01 Apr 2026' },
              { type: 'text', text: '07 Apr 2026' },
            ],
          },
        ],
      },
    };

    console.log('\n--> Attempting to send Template Payload (en_US)...');
    
    try {
      const response = await axios.post(url, templatePayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('✅ Template Message sent successfully!');
      console.log(response.data);
    } catch (errTemplate) {
      console.error('❌ Error sending Template Message:');
      console.error(JSON.stringify(errTemplate.response?.data || errTemplate.message, null, 2));

      console.log('\n--> Falling back to Standard Text Message...');
      const responseText = await axios.post(url, fallbackPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('✅ Text Message sent successfully!');
      console.log(responseText.data);
    }

  } catch (errFallback) {
    console.error('\n❌ Error sending Text Message fallback:');
    console.error(JSON.stringify(errFallback.response?.data || errFallback.message, null, 2));
  }
}

run();
