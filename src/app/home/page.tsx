"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase/client";
import PropertyCard, { Property } from "../components/PropertyCard";

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from('property')
          .select('p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions, p_price_per_night, p_image')
          .limit(20);

        if (error) {
          console.error('Error fetching properties:', error);
          if (mounted) setError(error.message ?? JSON.stringify(error));
        } else {
          if (mounted) {
            const rows = (data ?? []) as any[];
            const mapped: Property[] = rows
              .map((r) => {
                const rawId = r.p_id ?? r.id ?? r.property_id;
                const p_id = Number(rawId);
                const p_address = r.p_address ?? r.address ?? r.name ?? '';
                const p_bedrooms = Number(r.p_bedrooms ?? r.bedrooms ?? r.num_bedrooms ?? 0);
                const p_bathrooms = Number(r.p_bathrooms ?? r.bathrooms ?? r.num_bathrooms ?? 0);
                const p_dimensions = Number(r.p_dimensions ?? r.dimensions ?? r.size ?? 0);
                const p_price_per_night = Number(r.p_price_per_night ?? r.price ?? 100);
                const p_image = r.p_image ?? r.image ?? '';
                return { p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions, p_price_per_night,p_image };
              })
              .filter((p) => Number.isFinite(p.p_id) && p.p_id > 0);

          setProperties(mapped);
        }
      }
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProperties();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="loading-state p-8 text-center">Loading properties...</div>;
  }

  if (error) {
    return (
      <div className="error-state p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <div className="mt-3">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              setError('');
              setLoading(true);

              (async function retry() {
                try {
                  const { data, error } = await supabase
                    .from('property')
                    .select('p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions, p_price_per_night')
                    .limit(20);
                  if (error) {
                    setError(error.message ?? JSON.stringify(error));
                    setLoading(false);
                    return;
                  }
                  const rows = (data ?? []) as any[];
                  const mapped: Property[] = rows
                    .map((r) => {
                      const rawId = r.p_id ?? r.id ?? r.property_id;
                      const p_id = Number(rawId);
                      const p_address = r.p_address ?? r.address ?? r.name ?? '';
                      const p_bedrooms = Number(r.p_bedrooms ?? r.bedrooms ?? r.num_bedrooms ?? 0);
                      const p_bathrooms = Number(r.p_bathrooms ?? r.bathrooms ?? r.num_bathrooms ?? 0);
                      const p_dimensions = Number(r.p_dimensions ?? r.dimensions ?? r.size ?? 0);
                      const p_price_per_night = Number(r.p_price_per_night ?? r.price ?? 100);
                      const p_image = r.p_image ?? r.image ?? '';
                      return { p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions, p_price_per_night, p_image };
                    })
                    .filter((p) => Number.isFinite(p.p_id) && p.p_id > 0);
                  setProperties(mapped);
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setLoading(false);
                }
              })();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage-container px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Explore Destinations</h1>
      </header>

      <div className="properties-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <PropertyCard key={property.p_id} property={property} />
        ))}
      </div>

      {properties.length === 0 && (
        <div className="no-results mt-6">
          <p>No properties found.</p>
        </div>
      )}
    </div>
  );
}
