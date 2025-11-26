"use client";
import { useRouter } from 'next/navigation';

export interface Property {
  p_id: number;         
  p_address: string;    
  p_bedrooms: number;   
  p_bathrooms: number;  
  p_dimensions: number;
  p_price_per_night: number;
  p_image: string;
}

export interface PropertyCardProps {
  property: Property;
}


export default function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const imageURL = property.p_image;
  
  const address = property.p_address ?? 'Address not provided';
  const bedrooms = property.p_bedrooms ?? 0;
  const bathrooms = property.p_bathrooms ?? 0;
  const dimensions = property.p_dimensions ?? 0;
  const pricePerNight = property.p_price_per_night ?? 100;

  const handleBookNow = () => {
    router.push(`/booking/${property.p_id}`);
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden shadow-lg transition duration-300 hover:shadow-xl border border-gray-100 bg-white">
      
      <div className="aspect-video w-full relative bg-gray-50">
        <img
          src={imageURL}
          alt={`Placeholder for property at ${address}`}
          className="object-cover w-full h-full"
        />
      </div>
      
      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">{address}</h3>
        </div>
        <hr className="my-3 border-gray-100" />
        
        <div className="grid grid-cols-3 gap-2 text-gray-700 font-medium mb-3">
          <div className="flex items-center text-sm">
            <span className="mr-2 text-red-500" aria-hidden="true">🛏️</span>
            <span>{bedrooms} {bedrooms === 1 ? 'bed' : 'beds'}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="mr-2 text-green-500" aria-hidden="true">🛁</span>
            <span>{bathrooms} {bathrooms === 1 ? 'bath' : 'baths'}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="mr-2 text-blue-500" aria-hidden="true">📏</span>
            <span className="truncate">{dimensions} sq ft</span>
          </div>
        </div>

        {/* Price and Book Button */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-gray-900">
              ${pricePerNight}
            </span>
            <span className="text-sm text-gray-600"> / night</span>
          </div>
          <button
            onClick={handleBookNow}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
