import { decrypt, encrypt } from './encryption';

describe('encryption', () => {
  const previousKey = process.env.FIELD_ENCRYPT_KEY;

  beforeEach(() => {
    process.env.FIELD_ENCRYPT_KEY = Buffer.from(
      '0123456789abcdef0123456789abcdef',
    ).toString('base64');
  });

  afterAll(() => {
    process.env.FIELD_ENCRYPT_KEY = previousKey;
  });

  it('round-trips encrypted values', () => {
    const value = 'hello world';
    expect(decrypt(encrypt(value))).toBe(value);
  });
});
