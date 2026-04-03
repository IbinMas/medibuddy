import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SmsService } from '../common/sms/sms.service';
import { encrypt } from '../common/crypto/encryption';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const smsService = app.get(SmsService);

  const phone = '0245655799';
  console.log(`Testing SMS to ${phone}...`);

  const mockPatient = {
    firstNameEncrypted: encrypt('Test'),
    phoneEncrypted: encrypt(phone),
    notificationMedium: 'SMS',
  };

  const mockPharmacy = {
    name: 'MediBuddy Test Pharmacy',
  };

  const mockPrescription = {
    medicationEncrypted: encrypt('Paracetamol'),
    dosage: '500mg',
    frequency: '3 times daily',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  try {
    const result = await smsService.sendPrescriptionMessage(mockPatient, mockPharmacy, mockPrescription);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error sending SMS:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
