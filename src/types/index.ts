export interface ReadingEvent {
    id: string;
    title: string;
    author: string;
    date: string; // ISO 8601
    location: {
        name: string;
        address: string;
        lat: number;
        lng: number;
    };
    price: {
        amount: number;
        currency: string;
    };
    description?: string;
    url?: string;
    source: string;
}

export type EventFilter = {
    author?: string;
    maxPrice?: number;
    dateRange?: {
        start: Date;
        end: Date;
    };
    location?: {
        lat: number;
        lng: number;
        radiusKm: number;
    };
};
