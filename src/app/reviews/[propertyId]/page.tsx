"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";
import { useRouter } from 'next/navigation'
import ReviewBox from "../../components/ReviewBox";

type Reviews ={
  r_id: number;
  r_star: number;
  r_text: string;
}


export default function ReviewPage({ params }: any) {
  const propertyId = Number(params.propertyId);
  const [ratingReview, setRatingReview] = useState<Reviews[]>([]);
  const router = useRouter()

  useEffect (() =>{
    const showReview = async() =>{
      const {data, error} = await supabase
      .from("reviews")
      .select("r_id, r_star, r_text")
      .eq("p_id", propertyId);
    
    if(error){
      console.error("An error occurred loading reviews for this property.",error);
    }
    else{
      setRatingReview(data);
    }
    }
    if(propertyId){
      showReview();
    }
  },[propertyId])


  return (
    <div>
        <div className="flex">
            <h1 className="font-bold text-5xl">Property Reviews</h1>
            <span>
                <button
                onClick={() => router.back()}
                className="mt-4 ml-3 mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
                </button>
            </span>
        </div>
    {ratingReview.length === 0 ? (
      <p>No reviews have been made for this property.</p>
    ) : (
      ratingReview.map((i) => (
        <ReviewBox
          key = {i.r_id}
          r_star = {i.r_star}
          r_text = {i.r_text}
        />
      ))
    )}
  </div>
  );
}
