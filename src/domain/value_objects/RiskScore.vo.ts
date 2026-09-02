import type { RiskLevel } from '../types/hazard.types';

export class RiskScore {
  private readonly _score: number;

  constructor(score: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    this._score = clamped;
  }

  public get value(): number {
    return this._score;
  }

  public get level(): RiskLevel {
    if (this._score <= 30) return 'low';
    if (this._score <= 60) return 'medium';
    if (this._score <= 80) return 'high';
    return 'extreme';
  }

  public getLabel(lang: 'id' | 'en'): string {
    const level = this.level;
    if (lang === 'id') {
      switch (level) {
        case 'low': return 'Rendah';
        case 'medium': return 'Sedang';
        case 'high': return 'Tinggi';
        case 'extreme': return 'Ekstrem';
        case 'insufficient_data':
        default:
          return 'Data Tidak Tersedia';
      }
    } else {
      switch (level) {
        case 'low': return 'Low Risk';
        case 'medium': return 'Moderate Risk';
        case 'high': return 'High Risk';
        case 'extreme': return 'Extreme Risk';
        case 'insufficient_data':
        default:
          return 'Insufficient Data';
      }
    }
  }

  public getColorHex(): string {
    switch (this.level) {
      case 'low': return '#10b981'; // Green
      case 'medium': return '#f59e0b'; // Amber
      case 'high': return '#ef4444'; // Red
      case 'extreme': return '#dc2626'; // Dark Red
      case 'insufficient_data':
      default:
        return '#64748b'; // Slate gray
    }
  }
}
