// JobsPage component
// Shows all jobs with add, edit, and archive options
import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Archive,
  ArchiveRestore,
  GripVertical,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { mockAPI } from "../lib/mockAPI";

export default function JobsPage({ onJobSelect, selectedJobId, onBack }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [draggedJob, setDraggedJob] = useState(null);
  const queryClient = useQueryClient();
  const pageSize = 10;

  // Fetch jobs with filters and pagination
  const {
    data: jobsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "jobs",
      { search: searchTerm, status: statusFilter, page: currentPage, pageSize },
    ],
    queryFn: () =>
      mockAPI.getJobs({
        search: searchTerm,
        status: statusFilter,
        page: currentPage,
        pageSize,
      }),
  });

  // Get single job for detail view
  const { data: selectedJob } = useQuery({
    queryKey: ["job", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return null;
      const jobs = await mockAPI.getJobs({});
      return jobs.data.find((job) => job.id === selectedJobId);
    },
    enabled: !!selectedJobId,
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: mockAPI.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setShowCreateModal(false);
      toast.success("Job created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create job");
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, ...updates }) => mockAPI.updateJob(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setEditingJob(null);
      toast.success("Job updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update job");
    },
  });

  // Reorder jobs mutation with optimistic updates
  const reorderJobsMutation = useMutation({
    mutationFn: ({ fromOrder, toOrder }) =>
      mockAPI.reorderJobs(fromOrder, toOrder),
    onMutate: async ({ fromOrder, toOrder }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      // Snapshot previous value
      const previousJobs = queryClient.getQueryData([
        "jobs",
        {
          search: searchTerm,
          status: statusFilter,
          page: currentPage,
          pageSize,
        },
      ]);

      // Optimistically update
      if (previousJobs) {
        const newJobs = { ...previousJobs };
        const jobs = [...newJobs.data];

        // Reorder logic
        jobs.forEach((job) => {
          if (job.order === fromOrder) {
            job.order = toOrder;
          } else if (
            fromOrder < toOrder &&
            job.order > fromOrder &&
            job.order <= toOrder
          ) {
            job.order -= 1;
          } else if (
            fromOrder > toOrder &&
            job.order >= toOrder &&
            job.order < fromOrder
          ) {
            job.order += 1;
          }
        });

        jobs.sort((a, b) => a.order - b.order);
        newJobs.data = jobs;

        queryClient.setQueryData(
          [
            "jobs",
            {
              search: searchTerm,
              status: statusFilter,
              page: currentPage,
              pageSize,
            },
          ],
          newJobs,
        );
      }

      return { previousJobs };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(
          [
            "jobs",
            {
              search: searchTerm,
              status: statusFilter,
              page: currentPage,
              pageSize,
            },
          ],
          context.previousJobs,
        );
      }
      toast.error("Failed to reorder jobs - changes rolled back");
    },
    onSuccess: () => {
      toast.success("Jobs reordered successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue,
    formState: { errors: editErrors },
  } = useForm();

  const onCreateSubmit = useCallback(
    (data) => {
      // Check for unique slug
      const slug = data.title.toLowerCase().replace(/\s+/g, "-");
      const existingJob = jobsData?.data.find((job) => job.slug === slug);

      if (existingJob) {
        toast.error("A job with this title already exists");
        return;
      }

      createJobMutation.mutate({
        ...data,
        slug,
        status: "active",
        tags: data.tags ? data.tags.split(",").map((tag) => tag.trim()) : [],
        requirements: data.requirements
          ? data.requirements.split("\n").filter((req) => req.trim())
          : [],
      });
    },
    [createJobMutation, jobsData],
  );

  const onEditSubmit = useCallback(
    (data) => {
      if (!editingJob) return;

      updateJobMutation.mutate({
        id: editingJob.id,
        ...data,
        tags: data.tags ? data.tags.split(",").map((tag) => tag.trim()) : [],
        requirements: data.requirements
          ? data.requirements.split("\n").filter((req) => req.trim())
          : [],
      });
    },
    [updateJobMutation, editingJob],
  );

  const handleArchiveToggle = useCallback(
    (job) => {
      updateJobMutation.mutate({
        id: job.id,
        status: job.status === "active" ? "archived" : "active",
      });
    },
    [updateJobMutation],
  );

  const handleEdit = useCallback(
    (job) => {
      setEditingJob(job);
      setValue("title", job.title);
      setValue("description", job.description);
      setValue("tags", job.tags.join(", "));
      setValue("requirements", job.requirements.join("\n"));
    },
    [setValue],
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((e, job) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e, targetJob) => {
      e.preventDefault();

      if (!draggedJob || draggedJob.id === targetJob.id) {
        setDraggedJob(null);
        return;
      }

      reorderJobsMutation.mutate({
        fromOrder: draggedJob.order,
        toOrder: targetJob.order,
      });

      setDraggedJob(null);
    },
    [draggedJob, reorderJobsMutation],
  );

  // If showing job detail
  if (selectedJobId && selectedJob) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedJob.title}
              </h1>
              <div className="flex items-center mt-2 space-x-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedJob.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedJob.status}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(selectedJob.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleEdit(selectedJob)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700">{selectedJob.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Requirements
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {selectedJob.requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Error loading jobs: {error.message}</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {jobsData?.data.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, job)}
                  className={`p-4 hover:bg-gray-50 cursor-move ${
                    draggedJob?.id === job.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {job.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {job.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex space-x-1">
                            {job.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            Order: {job.order}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onJobSelect(job.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(job)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchiveToggle(job)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title={
                          job.status === "active" ? "Archive" : "Unarchive"
                        }
                      >
                        {job.status === "active" ? (
                          <Archive className="w-4 h-4" />
                        ) : (
                          <ArchiveRestore className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {jobsData && jobsData.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, jobsData.total)} of{" "}
                  {jobsData.total} jobs
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {jobsData.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(jobsData.totalPages, prev + 1),
                      )
                    }
                    disabled={currentPage === jobsData.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Create New Job
            </h2>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  {...register("title", { required: "Title is required" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  {...register("tags")}
                  placeholder="Engineering, Senior, Remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements (one per line)
                </label>
                <textarea
                  {...register("requirements")}
                  rows={3}
                  placeholder="5+ years experience&#10;Strong communication skills&#10;Team player"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createJobMutation.isLoading ? "Creating..." : "Create Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Job</h2>
            <form
              onSubmit={handleSubmitEdit(onEditSubmit)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  {...registerEdit("title", { required: "Title is required" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {editErrors.title && (
                  <p className="text-red-600 text-sm mt-1">
                    {editErrors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...registerEdit("description")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  {...registerEdit("tags")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements (one per line)
                </label>
                <textarea
                  {...registerEdit("requirements")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingJob(null);
                    resetEdit();
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateJobMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateJobMutation.isLoading ? "Updating..." : "Update Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
