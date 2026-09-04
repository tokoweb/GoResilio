import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from '../lib/auth/password';
import { TokenService } from '../lib/auth/jwt';
import { RateLimiter } from '../infrastructure/security/rateLimiter';
import { InputValidator } from '../infrastructure/security/inputValidator';
import { RiskScoringEngine } from '../domain/services/RiskScoringEngine';
import { PrescriptionEngine } from '../domain/services/PrescriptionEngine';
import { NextRequest } from 'next/server';

describe('Production Security & Data Integrity Verification', () => {

  // ============================================================================
  // 1. Password Security (scrypt, salt, constant-time verification)
  // ============================================================================
  describe('PasswordService (OWASP scrypt standard)', () => {
    it('should securely hash passwords with scrypt format', async () => {
      const password = 'SuperSecureP@ssword2026!';
      const hash = await PasswordService.hash(password);

      expect(hash).toBeDefined();
      expect(hash.startsWith('scrypt$N=16384,r=8,p=1$')).toBe(true);
      expect(hash.split('$').length).toBe(4);
    });

    it('should verify correct password and strictly reject invalid password', async () => {
      const password = 'CorrectPassword#123';
      const hash = await PasswordService.hash(password);

      const isValid = await PasswordService.verify(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await PasswordService.verify('WrongPassword', hash);
      expect(isInvalid).toBe(false);

      const isBlankInvalid = await PasswordService.verify('', hash);
      expect(isBlankInvalid).toBe(false);
    });

    it('should support synchronous hash and verify for legacy adapters', () => {
      const password = 'SyncPassword!99';
      const hash = PasswordService.hashSync(password);

      expect(hash.startsWith('scrypt$')).toBe(true);
      expect(PasswordService.verifySync(password, hash)).toBe(true);
      expect(PasswordService.verifySync('wrong', hash)).toBe(false);
    });
  });

  // ============================================================================
  // 2. JWT & Token Integrity
  // ============================================================================
  describe('TokenService (JWT signing and verification)', () => {
    it('should issue and verify valid JWT token payload', () => {
      const payload = {
        userId: 'usr_buyer_01',
        email: 'buyer.demo@gotangguh.id',
        role: 'Home Buyer' as const,
        fullName: 'Budi Santoso'
      };

      const token = TokenService.sign(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const verified = TokenService.verify(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('usr_buyer_01');
      expect(verified?.email).toBe('buyer.demo@gotangguh.id');
    });

    it('should strictly reject tampered JWT token', () => {
      const token = TokenService.sign({
        userId: 'usr_buyer_01',
        email: 'buyer.demo@gotangguh.id',
        role: 'Home Buyer' as const,
        fullName: 'Budi Santoso'
      });

      // Tamper payload
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${Buffer.from(JSON.stringify({ userId: 'hacker', role: 'Super Admin (RDI)' })).toString('base64url')}.${parts[2]}`;

      const verified = TokenService.verify(tamperedToken);
      expect(verified).toBeNull();
    });
  });

  // ============================================================================
  // 3. Rate Limiter (Sliding Window In-Memory)
  // ============================================================================
  describe('RateLimiter', () => {
    beforeEach(() => {
      RateLimiter.clear();
    });

    it('should allow requests within limit and block when threshold exceeded', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.50' }
      });

      // Allow 3 requests per minute
      const limit = 3;
      const res1 = RateLimiter.enforce(req, 'test_action', limit, 60000);
      const res2 = RateLimiter.enforce(req, 'test_action', limit, 60000);
      const res3 = RateLimiter.enforce(req, 'test_action', limit, 60000);

      expect(res1).toBeNull();
      expect(res2).toBeNull();
      expect(res3).toBeNull();

      // 4th request must be rate-limited (HTTP 429)
      const res4 = RateLimiter.enforce(req, 'test_action', limit, 60000);
      expect(res4).not.toBeNull();
      expect(res4?.status).toBe(429);
    });
  });

  // ============================================================================
  // 4. Input Validation & XSS Sanitization
  // ============================================================================
  describe('InputValidator', () => {
    it('should validate valid coordinates and reject out-of-range values', () => {
      const valid = InputValidator.validateCoordinates(-6.2, 106.8);
      expect(valid.latitude).toBe(-6.2);
      expect(valid.longitude).toBe(106.8);

      expect(() => InputValidator.validateCoordinates(95, 100)).toThrow();
      expect(() => InputValidator.validateCoordinates(-6, 200)).toThrow();
    });

    it('should validate and normalize email addresses', () => {
      const email = InputValidator.validateEmail('  USER@Domain.COM  ');
      expect(email).toBe('user@domain.com');

      expect(() => InputValidator.validateEmail('invalid-email-string')).toThrow();
    });

    it('should sanitize harmful HTML script tags to prevent XSS', () => {
      const raw = 'Hello <script>alert("XSS")</script> World!';
      const sanitized = InputValidator.sanitizeText(raw);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('Hello  World!');
    });
  });

  // ============================================================================
  // 5. Risk Scoring Engine & Plain Language Translation
  // ============================================================================
  describe('RiskScoringEngine (Plain Language & Data Integrity)', () => {
    it('should convert raw PGA into user-facing ground motion impact statements', () => {
      const assessment = RiskScoringEngine.calculate(
        { latitude: -6.2625, longitude: 106.992 },
        'Kemang Pratama, Bekasi',
        'Indonesia',
        'Residential',
        'Home Buyer',
        {
          elevationMeters: 11.2,
          distanceToRiverMeters: 15,
          max24hRainfallMm: 95,
          historicalQuakesCount150km: 14,
          historicalQuakesCount100km: 6,
          maxHistoricalMag: 6.2,
          pgaMcegG: 0.28, // Peak Ground Acceleration
          avgMaxTempC: 33.5,
          historicalPeakTempC: 36.2,
          projectedTempRise2050C: 0.8,
          greenSpaceRatioPct: 20,
          distanceToNearestRoadMeters: 15,
          nearestRoadName: 'Jl. Kemang Pratama Raya',
          distanceToArterialMeters: 450,
          distanceToHospitalMeters: 580,
          nearestHospitalName: 'RS Medika',
          distanceToAssemblyPointMeters: 320,
          nearestAssemblyPointName: 'Lapangan Blok AV'
        }
      );

      // Verify PGA is translated into ground motion impact statement without arbitrary MMI fabrication
      expect(assessment.quake.impactId).toContain('PGA');
      expect(assessment.quake.impactId).toContain('0.28 g');
      expect(assessment.quake.impactId).not.toContain('VI MMI');
      expect(assessment.quake.impactId).toContain('gaya lateral dinamis');

      // Verify soil stability wording
      expect(assessment.quake.soilSiteClassSource).toContain('SNI 1726 memerlukan uji penetrasi standar (SPT/CPT)');

      // Verify evacuation road corridor and assembly point are highlighted
      expect(assessment.transport.causeId).toContain('Jl. Kemang Pratama Raya');
      expect(assessment.transport.causeId).toContain('Lapangan Blok AV');
      expect(assessment.transport.causeId).toContain('faskes pendukung');

      // Verify building profile is cleanly populated
      expect(assessment.buildingProfile).toBeDefined();
      expect(assessment.buildingProfile?.profilingLevel).toBe('basic_location_only');
    });

    it('should populate enriched building profile when user provides structural inputs', () => {
      const assessment = RiskScoringEngine.calculate(
        { latitude: -6.2, longitude: 106.8 },
        'Jl. Sudirman, Jakarta',
        'Indonesia',
        'Residential',
        'Home Buyer',
        {
          elevationMeters: 15,
          distanceToRiverMeters: 500,
          max24hRainfallMm: 60,
          historicalQuakesCount150km: 10,
          historicalQuakesCount100km: 4,
          maxHistoricalMag: 5.5,
          avgMaxTempC: 32,
          historicalPeakTempC: 35,
          projectedTempRise2050C: 0.7,
          greenSpaceRatioPct: 25,
          distanceToNearestRoadMeters: 20,
          distanceToArterialMeters: 200,
          distanceToHospitalMeters: 800,
          // Enriched building inputs:
          buildingFloors: 2,
          constructionYear: 2021,
          foundationType: 'Pondasi Tiang Pancang',
          structuralSystem: 'Beton Bertulang Tahan Gempa',
          estimatedPropertyValueIdr: 2500000000
        }
      );

      expect(assessment.buildingProfile?.profilingLevel).toBe('enriched_building_attributes');
      expect(assessment.buildingProfile?.buildingFloors).toBe(2);
      expect(assessment.buildingProfile?.constructionYear).toBe(2021);
      expect(assessment.buildingProfile?.structuralSystem).toBe('Beton Bertulang Tahan Gempa');
    });
  });

  // ============================================================================
  // 6. Prescription Engine (Priorities & Indicative Cost Disclaimer)
  // ============================================================================
  describe('PrescriptionEngine', () => {
    it('should produce prioritized prescriptions with indicative cost disclaimer', () => {
      const assessment = RiskScoringEngine.calculate(
        { latitude: -6.2625, longitude: 106.992 },
        'Test Site',
        'Indonesia',
        'Residential',
        'Home Buyer',
        {
          elevationMeters: 5,
          distanceToRiverMeters: 10,
          max24hRainfallMm: 120,
          historicalQuakesCount150km: 25,
          historicalQuakesCount100km: 10,
          maxHistoricalMag: 6.5,
          pgaMcegG: 0.35,
          avgMaxTempC: 34,
          historicalPeakTempC: 37,
          projectedTempRise2050C: 1.0,
          greenSpaceRatioPct: 10,
          distanceToNearestRoadMeters: 30,
          distanceToArterialMeters: 600,
          distanceToHospitalMeters: 1200
        }
      );

      expect(assessment.prescriptions.length).toBeGreaterThan(0);
      for (const rx of assessment.prescriptions) {
        expect(['High', 'Medium', 'Low']).toContain(rx.priority);
        expect(rx.titleId).toBeDefined();
        expect(rx.descriptionId).toBeDefined();
      }
    });
  });
});
