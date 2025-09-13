import { useEffect, useRef } from "react";
import { useTTSStore } from "../stores/ttsStore";
import { runPodAPI, JobResponse } from "../services/api";

export const useJobPolling = (
  jobId: string | null,
  pollingInterval: number = 2000
) => {
  const { updateJobStatus, isJobRunning } = useTTSStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId || !isJobRunning(jobId)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const pollJob = async () => {
      try {
        const status: JobResponse = await runPodAPI.pollJobStatus(jobId);

        // Map RunPod status to our store status
        let storeStatus: "pending" | "running" | "completed" | "failed";
        switch (status.status) {
          case "IN_QUEUE":
            storeStatus = "pending";
            break;
          case "IN_PROGRESS":
            storeStatus = "running";
            break;
          case "COMPLETED":
            storeStatus = "completed";
            break;
          case "FAILED":
          case "CANCELLED":
            storeStatus = "failed";
            break;
          default:
            storeStatus = "pending";
        }

        updateJobStatus(jobId, storeStatus, status.output, status.error);

        // Stop polling if job is completed or failed
        if (storeStatus === "completed" || storeStatus === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        updateJobStatus(
          jobId,
          "failed",
          undefined,
          error instanceof Error ? error.message : "Polling failed"
        );

        // Stop polling on error
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Start polling
    intervalRef.current = setInterval(pollJob, pollingInterval);

    // Cleanup on unmount or jobId change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, pollingInterval, updateJobStatus, isJobRunning]);

  // Manual poll function for manual refresh
  const manualPoll = async () => {
    if (!jobId) return;

    try {
      const status: JobResponse = await runPodAPI.pollJobStatus(jobId);

      let storeStatus: "pending" | "running" | "completed" | "failed";
      switch (status.status) {
        case "IN_QUEUE":
          storeStatus = "pending";
          break;
        case "IN_PROGRESS":
          storeStatus = "running";
          break;
        case "COMPLETED":
          storeStatus = "completed";
          break;
        case "FAILED":
        case "CANCELLED":
          storeStatus = "failed";
          break;
        default:
          storeStatus = "pending";
      }

      updateJobStatus(jobId, storeStatus, status.output, status.error);
      return status;
    } catch (error) {
      console.error("Manual polling error:", error);
      updateJobStatus(
        jobId,
        "failed",
        undefined,
        error instanceof Error ? error.message : "Manual polling failed"
      );
      throw error;
    }
  };

  return { manualPoll };
};
