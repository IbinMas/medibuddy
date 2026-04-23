"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const sms_service_1 = require("../common/sms/sms.service");
const encryption_1 = require("../common/crypto/encryption");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const smsService = app.get(sms_service_1.SmsService);
    const phone = '0245655799';
    console.log(`Testing SMS to ${phone}...`);
    const mockPatient = {
        firstNameEncrypted: (0, encryption_1.encrypt)('Test'),
        phoneEncrypted: (0, encryption_1.encrypt)(phone),
        notificationMedium: 'SMS',
    };
    const mockPharmacy = {
        name: 'MediBuddy Test Pharmacy',
    };
    const mockPrescription = {
        medicationEncrypted: (0, encryption_1.encrypt)('Paracetamol'),
        dosage: '500mg',
        frequency: '3 times daily',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    try {
        const result = await smsService.sendPrescriptionMessage(mockPatient, mockPharmacy, mockPrescription);
        console.log('Result:', JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error('Error sending SMS:', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=test-sms.js.map