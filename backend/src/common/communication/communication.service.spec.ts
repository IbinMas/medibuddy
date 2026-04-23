import { CommunicationService } from './communication.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationMedium, DeliveryStatus } from '@prisma/client';
import { encrypt } from '../crypto/encryption';

describe('CommunicationService search and pagination', () => {
  const prisma = {
    communicationLog: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  } as unknown as PrismaService;

  const service = new CommunicationService(prisma);

  beforeAll(() => {
    process.env.FIELD_ENCRYPT_KEY = Buffer.from(
      '0123456789abcdef0123456789abcdef',
    ).toString('base64');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters logs by search term across content and patient fields', async () => {
    (prisma.communicationLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'log-1',
        pharmacyId: 'pharmacy-1',
        medium: NotificationMedium.SMS,
        status: DeliveryStatus.PENDING,
        content: 'Take Amoxicillin tonight',
        createdAt: new Date(),
        patient: {
          firstNameEncrypted: encrypt('Jane'),
          lastNameEncrypted: encrypt('Doe'),
          phoneEncrypted: encrypt('0200000000'),
        },
      },
      {
        id: 'log-2',
        pharmacyId: 'pharmacy-1',
        medium: NotificationMedium.SMS,
        status: DeliveryStatus.PENDING,
        content: 'Morning reminder',
        createdAt: new Date(),
        patient: {
          firstNameEncrypted: encrypt('Kofi'),
          lastNameEncrypted: encrypt('Mensah'),
          phoneEncrypted: encrypt('0300000000'),
        },
      },
    ]);
    (prisma.communicationLog.count as jest.Mock).mockResolvedValue(2);

    const result = await service.findAll('pharmacy-1', {
      page: 1,
      limit: 20,
      search: 'jane',
    });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].patient.firstName).toBe('Jane');
  });
});
