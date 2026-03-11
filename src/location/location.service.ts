import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  /* --------------------------
     HAVERSINE DISTANCE
  -------------------------- */
  distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  /* --------------------------
     POINT IN POLYGON CHECK
  -------------------------- */
  pointInPolygon(
    point: [number, number],
    polygon: [number, number][],
  ): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /* --------------------------
     GOOGLE MAPS DISTANCE
  -------------------------- */
  async googleDistance(origin: string, destination: string): Promise<number> {
    const key = process.env.GOOGLE_MAPS_KEY;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${key}`;

    const res = await axios.get(url);

    return res.data.rows[0].elements[0].distance.value / 1000;
  }

  /* --------------------------
     MAIN LOCATION CHECK
  -------------------------- */
  async canUserOrder(userId: string, vendorId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { deliveryZones: true },
    });

    if (!user || !vendor) return false;

    /* RADIUS CHECK */
    if (vendor.locationLockType === 'RADIUS') {
      if (
        user.latitude == null ||
        user.longitude == null ||
        vendor.latitude == null ||
        vendor.longitude == null
      ) {
        return false;
      }

      const distance = this.distanceKm(
        user.latitude,
        user.longitude,
        vendor.latitude,
        vendor.longitude,
      );

      return distance <= vendor.deliveryRadiusKm;
    }

    /* CITY CHECK */
    if (vendor.locationLockType === 'CITY') {
      return Boolean(user.city && vendor.city && user.city === vendor.city);
    }

    /* STATE CHECK */
    if (vendor.locationLockType === 'STATE') {
      return Boolean(user.state && vendor.state && user.state === vendor.state);
    }

    /* POLYGON CHECK */
    if (vendor.locationLockType === 'POLYGON') {
      if (user.latitude === null || user.longitude === null) {
        return false;
      }

      const userLat = user.latitude;
      const userLng = user.longitude;

      return vendor.deliveryZones.some((zone) =>
        this.pointInPolygon(
          [userLng, userLat],
          zone.polygon as [number, number][],
        ),
      );
    }

    return false;
  }
}
