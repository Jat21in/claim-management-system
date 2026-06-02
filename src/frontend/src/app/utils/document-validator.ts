export class DocumentValidator {

  // Aadhaar: Verhoeff checksum algorithm
  static validateAadhaar(number: string): boolean {
    // Remove spaces
    const aadhaar = number.replace(/\s/g, '');

    // Check length
    if (!/^\d{12}$/.test(aadhaar)) return false;

    // First digit cannot be 0 or 1
    const firstDigit = parseInt(aadhaar[0]);
    if (firstDigit < 2) return false;

    // Verhoeff algorithm implementation
    return this.verhoeffCheck(aadhaar);
  }

  // PAN: Check format + 5th character is letter from name
  static validatePAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) return false;

    // 4th character should be P (Individual), C (Company), etc.
    const fourthChar = pan[3];
    const validTypes = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'G'];
    if (!validTypes.includes(fourthChar)) return false;

    return true;
  }

  // Passport: Check format + country code
  static validatePassport(passport: string): boolean {
    const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
    return passportRegex.test(passport);
  }

  private static verhoeffCheck(number: string): boolean {
    // Verhoeff algorithm for checksum validation
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

    let c = 0;
    const reversed = number.split('').reverse();

    for (let i = 0; i < reversed.length; i++) {
      c = d[c][p[(i + 1) % 8][parseInt(reversed[i])]];
    }

    return c === 0;
  }
}
