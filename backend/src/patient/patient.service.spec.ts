import { PatientService } from './patient.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { encrypt } from '../common/crypto/encryption';

describe('PatientService tenant isolation', () => {
  const prisma = {
    patient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService;

  const auditService = {
    logAction: jest.fn(),
  } as unknown as AuditService;

  const service = new PatientService(prisma, auditService);

  beforeAll(() => {
    process.env.FIELD_ENCRYPT_KEY = Buffer.from(
      '0123456789abcdef0123456789abcdef',
    ).toString('base64');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.patient.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('scopes patient list queries by pharmacyId', async () => {
    await service.list('pharmacy-1');

    expect((prisma.patient.findMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: { pharmacyId: 'pharmacy-1', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('scopes patient history by pharmacyId and decrypts the patient payload', async () => {
    (prisma.patient.findFirst as jest.Mock).mockResolvedValue({
      id: 'patient-1',
      pharmacyId: 'pharmacy-1',
      nameEncrypted: encrypt('Jane Doe'),
      phoneEncrypted: encrypt('0200000000'),
      prescriptions: [],
    });

    const result = await service.getDecryptedHistory('patient-1', 'pharmacy-1');

    expect((prisma.patient.findFirst as jest.Mock).mock.calls[0][0]).toEqual({
      where: { id: 'patient-1', pharmacyId: 'pharmacy-1', deletedAt: null },
      include: { prescriptions: { include: { adherence: true } } },
    });
    expect(result?.name).toBe('Jane Doe');
    expect(result?.phone).toBe('0200000000');
  });
});
