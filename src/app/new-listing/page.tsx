/* CHANGE THE ERROR MESSAGES LATER; THESE WERE USED DURING DEBUGGING */

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client'; 

// default image; have NOT checked if this works or seen in action; need to update propertyCards display
const DEFAULT_IMAGE_URL = "https://dummyimage.com/600x400/5e5e5e/fff.jpg&text=No+Image+Found";

interface ListingFormData {
  p_address: string;
  p_bedrooms: number;
  p_bathrooms: number;
  p_essentials: number; 
  p_ac: number;         
  p_kitchens: number;   
  p_heating: number;    
  p_washers: number;    
  p_dryers: number;     
  p_tvs: number;        
  p_dimensions: number; 
  p_price_per_night: number;
  p_image: string; 
}

const initialFormData: ListingFormData = {
  p_address: '',
  p_bedrooms: 1,
  p_bathrooms: 1,
  p_essentials: 0, 
  p_ac: 0,
  p_kitchens: 0,
  p_heating: 0,
  p_washers: 0,
  p_dryers: 0,
  p_tvs: 0,
  p_dimensions: 500,
  p_price_per_night: 100,
  p_image: DEFAULT_IMAGE_URL, 
};

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);

  // AUTHENTICATION CHECK AND TENANT INFO FETCH
  useEffect(() => {
    const checkAuthAndFetchTenant = async () => {
      const t_id = localStorage.getItem('tenant_id');
      if (!t_id) {
        router.push('/login');
        return;
      }

      // using t_id for property owner check
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select(`*, property_owner (po_id)`) 
        .eq('t_id', t_id)
        .single();

      if (fetchError || !tenant) {
        setError("Could not load user data. Please try logging in again.");
        setLoading(false);
        return;
      }

      // get po_id if exists
      const po_id = tenant.property_owner && Array.isArray(tenant.property_owner) && tenant.property_owner.length > 0
          ? tenant.property_owner[0].po_id
          : null;
      
      setTenantInfo({ 
        ...tenant,
        po_id: po_id, // this will be NULL if not a host yet
        is_host: !!po_id
      });

      setLoading(false);
    };

    checkAuthAndFetchTenant();
  }, [router]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value, type } = target;

    if (target instanceof HTMLInputElement && type === 'file') {
        const file = target.files?.[0] || null;

        if (file) {
            setImageFile(file);
            setFormData(prev => ({
                ...prev,
                p_image: file.name, 
            }));
        } else {
            setImageFile(null);
            setFormData(prev => ({
                ...prev,
                p_image: DEFAULT_IMAGE_URL, 
            }));
        }
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' || name.startsWith('p_price') || name.startsWith('p_dimensions')
                ? Number(value)
                : value,
        }));
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);


  // PROPERTY SUBMISSION HANDLER
  const handleSubmit = async () => {    
    setError('');
    setIsSubmitting(true);
    
    if (!tenantInfo || formData.p_address.trim() === '') {
        setError("Missing user data or property address.");
        setIsSubmitting(false);
        return;
    }

    // HOST ID AND ROLLBACK TRACKING
    let hostId: number | null = tenantInfo.po_id;
    let isNewHost = false; 
    let publicImageUrl = DEFAULT_IMAGE_URL; 

    try {
        // STEP 1: CREATE PROPERTY OWNER RECORD (ON SUBMIT)
        if (!tenantInfo.is_host) {
            isNewHost = true; // marking as new host
            
            const { data: newHost, error: hostError } = await supabase
                .from('property_owner')
                .insert([
                    {
                        t_id: tenantInfo.t_id,
                        po_name: tenantInfo.t_name,
                        po_address: tenantInfo.t_address,
                        po_phone: tenantInfo.t_phone,
                        po_email: tenantInfo.t_email,
                    },
                ])
                .select('po_id')
                .single();

            if (hostError) {
                // on host creation fail, stop immediately
                throw new Error(`Host creation failed: ${hostError.message}`);
            }
            hostId = newHost.po_id;
        }

        if (hostId === null) {
            // should not happen if Step 1 succeeds, but as a final safeguard
            throw new Error("Could not determine Host ID after creation attempt.");
        }
        
        // STEP 2: CONDITIONAL IMAGE UPLOAD
        if (imageFile) {
            const address = formData.p_address.trim().replace(/[/\\]/g, '-'); 
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${address}.${fileExt}`; 
            const filePath = `${fileName}`; 

            const { error: uploadError } = await supabase.storage
                .from('propertyImages')
                .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                setError(`Image upload failed: ${uploadError.message}. Proceeding with default image.`);
            } else {
                const { data: publicUrlData } = supabase.storage
                    .from('propertyImages')
                    .getPublicUrl(filePath);
                    
                if (publicUrlData) {
                    publicImageUrl = publicUrlData.publicUrl;
                } else {
                     setError("Could not retrieve public image URL. Proceeding with default image.");
                }
            }
        } 

        // STEP 3: INSERT NEW PROPERTY LISTING
        const { error: propertyError } = await supabase
            .from('property')
            .insert([
                {
                    ...formData,
                    po_id: hostId,
                    p_image: publicImageUrl, 
                },
            ])
            .select()
            .single();

        if (propertyError) {
            //  ROLLBACK LOGIC
            if (isNewHost) {
                console.warn(`Property insert failed. Attempting to roll back property_owner record ${hostId}`);
                const { error: rollbackError } = await supabase
                    .from('property_owner')
                    .delete()
                    .eq('po_id', hostId); // rollback host creation
                
                if (rollbackError) {
                    console.error('Property Owner Rollback FAILED. Check DELETE RLS on property_owner:', rollbackError);
                }
            }
            // ------------------------------------------------------------------------------------------
            console.error('Property insert error:', propertyError);
            throw new Error(`Listing creation failed: ${propertyError.message}`);
        }

        // success message
        alert('Property listing created successfully!');
        router.push('/dashboard'); 

    } catch (err: any) {
      setError(`An unexpected error occurred during submission: ${err.message}`);
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  // --------------------------------------------------------------------------


  // HELPER COMPONENTS
  const CountInput = ({ label, name, value }: { label: string, name: keyof ListingFormData, value: number }) => (
      <label className="block">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <input
            type="number"
            name={name}
            value={value}
            onChange={handleChange}
            required
            min="0" 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
      </label>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Step 1: Location and Size</h2>
            <label className="block">
              <span className="text-gray-700 dark:text-gray-300">Address</span>
              <input type="text" name="p_address" value={formData.p_address} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
            </label>
            <label className="block">
              <span className="text-gray-700 dark:text-gray-300">Total Area (sq. ft)</span>
              <input type="number" name="p_dimensions" value={formData.p_dimensions} onChange={handleChange} required min="100" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
            </label>
            <div className="flex space-x-4">
              <label className="block flex-1">
                <span className="text-gray-700 dark:text-gray-300">Bedrooms</span>
                <input type="number" name="p_bedrooms" value={formData.p_bedrooms} onChange={handleChange} required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
              </label>
              <label className="block flex-1">
                <span className="text-gray-700 dark:text-gray-300">Bathrooms</span>
                <input 
                  type="number" 
                  name="p_bathrooms" 
                  value={formData.p_bathrooms} 
                  onChange={handleChange} 
                  required 
                  min="1" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" 
                />
              </label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Step 2: Amenities (Enter Count)</h2>
            <CountInput label="Essentials Kits" name="p_essentials" value={formData.p_essentials} />
            <CountInput label="Air Conditioning Units" name="p_ac" value={formData.p_ac} />
            <CountInput label="Heating Units" name="p_heating" value={formData.p_heating} />
            <CountInput label="Kitchens" name="p_kitchens" value={formData.p_kitchens} />
            <CountInput label="Washers" name="p_washers" value={formData.p_washers} />
            <CountInput label="Dryers" name="p_dryers" value={formData.p_dryers} />
            <CountInput label="TVs" name="p_tvs" value={formData.p_tvs} />
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Step 3: Price and Photos</h2>

            <label className="block">
              <span className="text-gray-700 dark:text-gray-300">Price Per Night (USD)</span>
              <input type="number" name="p_price_per_night" value={formData.p_price_per_night} onChange={handleChange} required min="10" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
            </label>

            <label className="block">
              <span className="text-gray-700 dark:text-gray-300 mb-2 block">Property Photo</span>
              <input
                type="file"
                name="p_image_file"
                accept="image/*"
                onChange={handleChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imageFile ? (
                  <p className="text-sm text-green-600 mt-2">File selected: {imageFile.name}</p>
              ) : (
                  <p className="text-sm text-gray-500 mt-2">No image selected.</p>
              )}
            </label>
            
          </div>
        );

      default:
        return <div>Review and Submit</div>;
    }
  };


  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Create New Listing (Step {step} of 3)</h1>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <form className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8"> 
        {renderStep()}

        <div className="flex justify-between items-center mt-8 pt-4 border-t">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit} // call handler
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
