export function EventCardSkeleton() {
    return (
        <div className="card p-5 sm:p-6 animate-pulse">
            <div className="flex gap-2 mb-3">
                <div className="h-5 w-16 bg-gray-200 rounded-md" />
                <div className="h-5 w-20 bg-gray-200 rounded-md" />
            </div>
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
            <div className="space-y-2">
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
        </div>
    );
}
