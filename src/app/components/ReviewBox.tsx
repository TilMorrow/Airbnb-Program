"use client";
import {FaStar} from 'react-icons/fa';


type ReviewBoxProps = {
    r_star: number;
    r_text: string;
};

const ReviewBox = ({r_star, r_text}: ReviewBoxProps) => {
  return(
    <div className='reviewBox border-3 border-gray-700 rounded thick-border mt-3 p-4'>
          <div className="starRating flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < r_star ? "text-yellow-400" : "text-gray-300"}>
                <FaStar className='text-3xl'/>
              </span>
            ))}
          </div>
          <p className='text-2xl'>{r_text}</p>
        </div>
  );
};
export default ReviewBox;


