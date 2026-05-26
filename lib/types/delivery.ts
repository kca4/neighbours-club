/**
 * Typed representation of a restaurant's weekly operating hours.
 * Stored as a Prisma Json field on Restaurant.hours.
 *
 * Cast from Prisma's JsonValue at runtime:
 *   const oh = restaurant.hours as OperatingHours;
 */
export interface DayHours {
  open: string;     // 24-hour "HH:MM"  e.g. "11:00"
  close: string;    // 24-hour "HH:MM"  e.g. "22:00"
  isClosed: boolean;
}

export interface OperatingHours {
  monday:    DayHours;
  tuesday:   DayHours;
  wednesday: DayHours;
  thursday:  DayHours;
  friday:    DayHours;
  saturday:  DayHours;
  sunday:    DayHours;
  [key: string]: DayHours; // index signature for dynamic day lookups
}
