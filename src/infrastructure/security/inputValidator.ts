/**
 * Type-safe input validation & sanitization for route handlers
 */
export class InputValidator {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  static validateEmail(email: unknown): string {
    if (typeof email !== 'string' || !email.trim()) {
      throw new Error('Alamat email wajib diisi.');
    }
    const normalized = email.trim().toLowerCase();
    if (normalized.length > 191 || !this.EMAIL_REGEX.test(normalized)) {
      throw new Error('Format alamat email tidak valid.');
    }
    return normalized;
  }

  static validateCoordinates(lat: unknown, lng: unknown): { latitude: number; longitude: number } {
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      throw new Error('Koordinat latitude dan longitude wajib disertakan.');
    }
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('Nilai latitude harus berada di rentang valid (-90 hingga 90).');
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Nilai longitude harus berada di rentang valid (-180 hingga 180).');
    }

    return { latitude, longitude };
  }

  static validateString(
    val: unknown,
    fieldName: string,
    minLen: number = 1,
    maxLen: number = 255
  ): string {
    if (typeof val !== 'string') {
      throw new Error(`Field '${fieldName}' harus berupa teks string.`);
    }
    const trimmed = val.trim();
    if (trimmed.length < minLen) {
      throw new Error(`Field '${fieldName}' minimal memiliki panjang ${minLen} karakter.`);
    }
    if (trimmed.length > maxLen) {
      throw new Error(`Field '${fieldName}' tidak boleh melebihi ${maxLen} karakter.`);
    }
    return trimmed;
  }

  static sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }
}
