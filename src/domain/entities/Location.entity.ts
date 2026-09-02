import { Coordinates } from '../value_objects/Coordinates.vo';

export class LocationEntity {
  public readonly id: string;
  public readonly coordinates: Coordinates;
  public readonly formattedAddress: string;
  public readonly cityDistrict: string;
  public readonly country: string;

  constructor(params: {
    id?: string;
    coordinates: Coordinates;
    formattedAddress: string;
    cityDistrict?: string;
    country: string;
  }) {
    this.id = params.id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.coordinates = params.coordinates;
    this.formattedAddress = params.formattedAddress;
    this.cityDistrict = params.cityDistrict || '';
    this.country = params.country;
  }
}
