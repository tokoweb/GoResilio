export class Coordinates {
  private readonly _lat: number;
  private readonly _lng: number;

  constructor(lat: number, lng: number) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude: ${lat}. Must be a finite number between -90 and 90.`);
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude: ${lng}. Must be a finite number between -180 and 180.`);
    }
    this._lat = lat;
    this._lng = lng;
  }

  public get lat(): number {
    return this._lat;
  }

  public get lng(): number {
    return this._lng;
  }

  public toString(): string {
    return `${this._lat.toFixed(5)}, ${this._lng.toFixed(5)}`;
  }

  public equals(other: Coordinates): boolean {
    return (
      Math.abs(this._lat - other.lat) < 0.00001 &&
      Math.abs(this._lng - other.lng) < 0.00001
    );
  }

  /**
   * Calculate Geodesic distance to another point using Haversine formula (km)
   */
  public distanceToKm(other: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(other.lat - this._lat);
    const dLon = this.deg2rad(other.lng - this._lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(this._lat)) *
        Math.cos(this.deg2rad(other.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
