"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";
import { useRouter } from 'next/navigation'
import ReviewBox from "../../components/ReviewBox";
import {FaStar} from 'react-icons/fa';

type Reviews ={
  r_id: number;
  r_star: number;
  r_text: string;
}


export default function ReviewPage({ params }: any) {
  const propertyId = Number(params.propertyId);
  const [ratingReview, setRatingReview] = useState<Reviews[]>([]);
  const router = useRouter()

  const[newRating, setNewRating] = useState(0);
  const[newReview, setNewReview] = useState("");
  const[submission, setSubmit] = useState(false);

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

  const Submitting = async() => {
    if (newRating === 0 || newReview === ""){
        alert("Informal Review, please try again.");
        return;
    }
    setSubmit(true);

    const{error} = await supabase
    .from("reviews")
    .insert({
        p_id: propertyId,
        r_star: newRating,
        r_text: newReview,
    });
    setSubmit(false);
    if(error){
        alert("Error in submitting review")
        return;
    }

        //prev = latest vesion of reviews
    setRatingReview(prev => [{
        r_id:Date.now(),
        r_star: newRating,
        r_text: newReview,
    },
    ...prev,  //puts into new array after reload of reviews
    ]);

    setNewRating(0);
    setNewReview("");

  };

  return (
    <div>
        <div className="ml-4">
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
                <h3 className="text-2xl">Make A Review!</h3>
                <div className="flex">
                    {[...Array(5)].map((_,j) => {
                        const currentStar = j + 1
                        return(
                            <span key = {j} className={currentStar <= newRating ? "text-yellow-400" : "text-gray-300"} onClick={() => setNewRating(currentStar)}>
                                <FaStar className='text-2xl'/>
                            </span>
                        );
                    })}
                </div>


            <div className='text-1xl m-1 mb-2'>
                <input type="text" 
                value={newReview}
                placeholder="Type your review here"
                onChange={(e) => setNewReview(e.target.value)}
                className="border-1 border-gray-700 h-10 w-2/3"/>
            </div>

            <button
            className="px-4 py-2 mb-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            onClick={Submitting}
            disabled={submission}
            >{submission ? "Submitting..." : "Submit"}</button>
        </div>
    {ratingReview.length === 0 ? (
      <p className="text-2xl">No reviews have been made for this property.</p>
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
