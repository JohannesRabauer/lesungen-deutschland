export interface ReadingEvent {
    id: string;
    title: string;
    author: string;
    date: string; // ISO 8601
    endDate?: string; // ISO 8601 end time if available
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
    reader?: string; // who is reading (may differ from author of the book)
    work?: string; // what book/work is being read
    targetAudience?: {
        ageRange?: string; // e.g. 'ab 4', '6-10', 'Erwachsene'
        group?: string; // e.g. 'Kinder', 'Jugendliche', 'Familien', 'Senioren'
    };
    scrapedAt?: string; // ISO timestamp of when this was scraped
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
