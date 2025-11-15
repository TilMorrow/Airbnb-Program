"use client";

import React from 'react';
import Link from "next/link";

export interface Property {
  p_id: number;         
  p_address: string;    
  p_bedrooms: number;   
  p_bathrooms: number;  
  p_dimensions: number; 

}

export interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {

  const PLACEHOLDER_IMAGE = 'https://dummyimage.com/400x300/5c5c5c/fff.png&text=Placeholder+Image';

  const address = property.p_address ?? 'Address not provided';
  const bedrooms = property.p_bedrooms ?? 0;
  const bathrooms = property.p_bathrooms ?? 0;
  const dimensions = property.p_dimensions ?? 0;

  return (

    <Link href={`/booking/${property.p_id}`}>  
      <div className="flex flex-col rounded-xl overflow-hidden shadow-lg transition duration-300 hover:shadow-xl border border-gray-100 bg-white">
  
        
        <div className="aspect-video w-full relative bg-gray-50">
          <img
            src={PLACEHOLDER_IMAGE}
            alt={`Placeholder for property at ${address}`}
            className="object-cover w-full h-full"
          />
        </div>
  
        
        <div className="p-4 flex flex-col justify-between flex-grow">
  
          <div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{address}</h3>
          </div>
  
          <hr className="my-3 border-gray-100" />
  
          
          <div className="grid grid-cols-3 gap-2 text-gray-700 font-medium">
  
            <div className="flex items-center text-sm">
              <span className="mr-2 text-red-500" aria-hidden>🛏️</span>
              <span>{bedrooms} {bedrooms === 1 ? 'bed' : 'beds'}</span>
            </div>
  
            <div className="flex items-center text-sm">
              <span className="mr-2 text-green-500" aria-hidden>🛁</span>
              <span>{bathrooms} {bathrooms === 1 ? 'bath' : 'baths'}</span>
            </div>
           
            <div className="flex items-center text-sm">
              <span className="mr-2 text-blue-500" aria-hidden>📏</span>
              <span className="truncate">{dimensions}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
