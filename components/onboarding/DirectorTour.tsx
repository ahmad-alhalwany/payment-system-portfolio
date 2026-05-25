"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useLocale } from "@/components/providers/LocaleProvider";

const TOUR_KEY = "tour-director-completed";

interface DirectorTourProps {
  ready?: boolean;
}

export default function DirectorTour({ ready = true }: DirectorTourProps) {
  const { t, isRtl } = useLocale();

  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem(TOUR_KEY)) return;

    const steps = [
      {
        element: "#tour-stats",
        popover: {
          title: t.tour.statsTitle,
          description: t.tour.statsDesc,
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        element: "#tour-actions",
        popover: {
          title: t.tour.actionsTitle,
          description: t.tour.actionsDesc,
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        element: "#tour-activities",
        popover: {
          title: t.tour.activitiesTitle,
          description: t.tour.activitiesDesc,
          side: "top" as const,
          align: "center" as const,
        },
      },
    ];

    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0,0,0,0.6)",
        progressText: t.tour.progress,
        nextBtnText: t.tour.next,
        prevBtnText: t.tour.prev,
        doneBtnText: t.tour.done,
        steps,
        onDestroyed: () => {
          localStorage.setItem(TOUR_KEY, "true");
        },
      });
      driverObj.drive();
    }, 1200);

    return () => clearTimeout(timer);
  }, [ready, t, isRtl]);

  return null;
}

export function restartDirectorTour() {
  localStorage.removeItem(TOUR_KEY);
  window.location.reload();
}
