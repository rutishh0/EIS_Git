import type { ParsedAirline } from "./parser";

export interface MappedAirlineData {
  airline: {
    name: string;
    region: string;
  };
  scorecard: {
    engineType: string;
    eisDate: Date | null;
    eisDateTbc: boolean;
    eisRisk: string;
    eisLead: string | null;
    lastUpdated: Date | null;
    orderDetails: string | null;
  };
  serviceLines: {
    name: string;
    ragStatus: string;
    statusText: string | null;
    comments: string | null;
  }[];
}

export function mapParsedData(parsed: ParsedAirline[]): MappedAirlineData[] {
  return parsed.map((airline) => ({
    airline: {
      name: airline.name,
      region: airline.region,
    },
    scorecard: {
      engineType: airline.engineType,
      eisDate: airline.eisDate ? new Date(airline.eisDate) : null,
      eisDateTbc: airline.eisDateTbc,
      eisRisk: airline.eisRisk,
      eisLead: airline.eisLead,
      lastUpdated: airline.lastUpdated ? new Date(airline.lastUpdated) : null,
      orderDetails: null,
    },
    serviceLines: airline.serviceLines,
  }));
}
