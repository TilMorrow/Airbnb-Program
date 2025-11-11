"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import PropertyCard, { Property } from '../components/PropertyCard';

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SAMPLE DATA; REMOVE WHEN FIXED
  const sampleData: Property[] = [
    { p_id: 1001, p_address: '123 Mockingbird Lane', p_bedrooms: 2, p_bathrooms: 1, p_dimensions: 850 },
    { p_id: 1002, p_address: '456 Sample Street', p_bedrooms: 3, p_bathrooms: 2, p_dimensions: 1200 },
    { p_id: 1003, p_address: '789 Test Ave', p_bedrooms: 1, p_bathrooms: 1, p_dimensions: 500 },
    { p_id: 1004, p_address: '22 Jump Street', p_bedrooms: 2, p_bathrooms: 1, p_dimensions: 850 },
    { p_id: 1005, p_address: '1800 Pennsylvania Avenue', p_bedrooms: 3, p_bathrooms: 2, p_dimensions: 1200 },
    { p_id: 1006, p_address: '338 Hemingway Drive', p_bedrooms: 1, p_bathrooms: 1, p_dimensions: 500 },
  ];

  const useSampleData = () => {
    setProperties(sampleData);
    setError('');
    setLoading(false);
  };

  const seedDatabase = async () => {
    setLoading(true);
    try {
      const inserts = sampleData.map(({ p_address, p_bedrooms, p_bathrooms, p_dimensions }) => ({
        p_address,
        p_bedrooms,
        p_bathrooms,
        p_dimensions,
      }));
      const { data, error } = await supabase.from('property').insert(inserts).select();
      if (error) {
        setError(error.message ?? JSON.stringify(error));
      } else {
        location.reload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function fetchProperties() {
      try {

        const { data, error } = await supabase
          .from('property')
          .select('p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions')
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
                return { p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions };
              })

              .filter((p) => Number.isFinite(p.p_id) && p.p_id > 0);

            setProperties(mapped);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching properties:', err);
        if (mounted) setError(err instanceof Error ? err.message : String(err));
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
    return <div className="loading-state">Loading properties...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="text-red-600">{error}</p>
        <div className="mt-3">
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              setError('');
              setLoading(true);

              (async function retry() {
                try {
                  const { data, error } = await supabase
                    .from('property')
                    .select('p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions')
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
                      return { p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions };
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
          <PropertyCard
            key={(property.p_id as React.Key)}
            property={property}
          />
        ))}
      </div>

      {properties.length === 0 && (
                <div className="no-results mt-6">
          <p>No properties found.</p>
          <div className="mt-3 flex gap-3">
            <button
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded"
              onClick={useSampleData}
            >
              Use sample data
            </button>
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded"
              onClick={seedDatabase}
            >
              Seed database
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">Use sample data to preview cards locally, or seed the DB (requires write access).</p>
        </div>
      )}
    </div>
  );
}
