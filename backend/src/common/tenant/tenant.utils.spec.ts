import { applyTenantWhere } from './tenant.utils';

describe('applyTenantWhere', () => {
  it('adds pharmacyId to the filter', () => {
    expect(applyTenantWhere({ patientId: '1' }, 'pharmacy-1')).toEqual({
      patientId: '1',
      pharmacyId: 'pharmacy-1',
    });
  });
});
