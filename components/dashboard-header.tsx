"use client";

import axios from "axios";
import {
  ArrowBigRight,
  ArrowRight,
  ArrowRightIcon,
  CircleAlert,
  CircleDashedIcon,
  Download,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
  title: string;
  onExport?: () => void;
  onSettings?: () => void;
}

export function DashboardHeader({
  title,
  onExport,
  onSettings,
}: DashboardHeaderProps) {
  const [status, setStatus] = useState("red");
  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    try {
      const response = await axios.get("https://metrictracker-be.onrender.com/health");
      if (response.status === 200) {
        setStatus("green");
      } else {
        setStatus("red");
      }
    } catch (error) {
      setStatus("red");
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between">
        <div className="gap-x-3">
          <Image
            src="/brand.png"
            alt="Brand Logo"
            width={100}
            height={100}
            className="mb-4"
          />
          <div>
            <h1 className="text-4xl text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground mb-6">
              Team-wise developer performance insights
            </p>
          </div>
        </div>
        <div>
          <Link href="/admin" className="flex items-center">
            <p>Admin </p>
            <ArrowRightIcon size={18} className="" />
          </Link>
          <div className="flex items-center gap-x-2">
            <div
              className={`h-2 w-2 ${
                status === "green" ? "bg-green-400" : "bg-red-400"
              } rounded-full animate-pulse`}
            ></div>
            <p className="text-sm">
              {status === "green" ? "online" : "offline"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {/* {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download size={16} />
            Export Report
          </button>
        )} */}
        {onSettings && (
          <button
            onClick={onSettings}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Settings size={16} />
            Settings
          </button>
        )}
      </div>
    </div>
  );
}
