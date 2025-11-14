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
          .from("property")
          .select("p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions")
          .limit(20);

        if (error) {
          if (mounted) setError(error.message ?? JSON.stringify(error));
          return;
        }

        if (mounted) {
          const rows = (data ?? []) as any[];

          const mapped: Property[] = rows
            .map((r) => ({
              p_id: Number(r.p_id ?? r.id ?? r.property_id),
              p_address: r.p_address ?? "",
              p_bedrooms: Number(r.p_bedrooms ?? 0),
              p_bathrooms: Number(r.p_bathrooms ?? 0),
              p_dimensions: Number(r.p_dimensions ?? 0),
            }))
            .filter((p) => Number.isFinite(p.p_id) && p.p_id > 0);

          setProperties(mapped);
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
    return <div className="loading-state">Loading properties...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="text-red-600">{error}</p>
        <button
          className="mt-3 px-3 py-2 bg-blue-600 text-white rounded"
          onClick={() => location.reload()}
        >
          Retry
        </button>
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
