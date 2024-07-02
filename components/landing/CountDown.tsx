"use client";

import { useState } from "react";

export default function CountDown() {
  const calculateTimeLeft = () => {
    const difference = +new Date(`2024-07-09`) - +new Date();
    let timeLeft = {
      days: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      };
    }

    return timeLeft;
  };

  const [timeLeft] = useState(() => calculateTimeLeft());

  return <div>{timeLeft.days} days</div>;
}
