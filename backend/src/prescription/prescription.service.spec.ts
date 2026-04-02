import { PrescriptionService } from './prescription.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReminderQueueService } from '../queue/reminder-queue.service';

describe('PrescriptionService tenant isolation', () => {
  const prisma = {
    patient: {
      findFirst: jest.fn(),
    },
    prescription: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const auditService = {
    logAction: jest.fn(),
  } as unknown as AuditService;

  const reminderQueue = {
    scheduleReminder: jest.fn(),
  } as unknown as ReminderQueueService;

  const service = new PrescriptionService(prisma, auditService, reminderQueue);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.prescription.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('scopes prescription history by patientId and pharmacyId', async () => {
    await service.history('patient-1', 'pharmacy-1');

    expect((prisma.prescription.findMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: { patientId: 'patient-1', pharmacyId: 'pharmacy-1' },
      include: { adherence: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('rejects prescription creation when the patient belongs to another pharmacy', async () => {
    (prisma.patient.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.create('pharmacy-1', {
        patientId: 'patient-1',
        medication: 'Amoxicillin',
        dosage: '500mg',
        frequency: '3x daily',
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-04-07T00:00:00.000Z',
      }),
    ).rejects.toThrow('Patient not found');

    expect((prisma.patient.findFirst as jest.Mock).mock.calls[0][0]).toEqual({
      where: { id: 'patient-1', pharmacyId: 'pharmacy-1', deletedAt: null },
    });
  });
});
