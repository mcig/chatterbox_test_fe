import { create } from "zustand";

export interface JobStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TTSStore {
  jobs: Record<string, JobStatus>;
  currentJobId: string | null;

  // Actions
  startJob: (jobId: string) => void;
  updateJobStatus: (
    jobId: string,
    status: JobStatus["status"],
    result?: any,
    error?: string
  ) => void;
  setCurrentJob: (jobId: string | null) => void;
  clearJob: (jobId: string) => void;
  clearAllJobs: () => void;

  // Getters
  getCurrentJob: () => JobStatus | null;
  isJobRunning: (jobId: string) => boolean;
}

export const useTTSStore = create<TTSStore>((set, get) => ({
  jobs: {},
  currentJobId: null,

  startJob: (jobId: string) => {
    const now = new Date();
    set((state) => ({
      jobs: {
        ...state.jobs,
        [jobId]: {
          id: jobId,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        },
      },
      currentJobId: jobId,
    }));
  },

  updateJobStatus: (
    jobId: string,
    status: JobStatus["status"],
    result?: any,
    error?: string
  ) => {
    set((state) => ({
      jobs: {
        ...state.jobs,
        [jobId]: {
          ...state.jobs[jobId],
          status,
          result,
          error,
          updatedAt: new Date(),
        },
      },
    }));
  },

  setCurrentJob: (jobId: string | null) => {
    set({ currentJobId: jobId });
  },

  clearJob: (jobId: string) => {
    set((state) => {
      const newJobs = { ...state.jobs };
      delete newJobs[jobId];
      return {
        jobs: newJobs,
        currentJobId: state.currentJobId === jobId ? null : state.currentJobId,
      };
    });
  },

  clearAllJobs: () => {
    set({ jobs: {}, currentJobId: null });
  },

  getCurrentJob: () => {
    const state = get();
    return state.currentJobId ? state.jobs[state.currentJobId] || null : null;
  },

  isJobRunning: (jobId: string) => {
    const job = get().jobs[jobId];
    return job?.status === "running" || job?.status === "pending";
  },
}));
