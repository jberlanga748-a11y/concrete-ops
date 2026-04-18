import { EmptyState } from "@/components/ui/feedback";

export function EmployeeSetupState({
  title = "Your employee profile still needs office setup",
  description = "This login is working, but the office still needs to link your employee record before time, uploads, and PPE tracking become available here.",
  actionHref,
  actionLabel,
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <EmptyState
      icon="users"
      title={title}
      description={description}
      actionHref={actionHref}
      actionLabel={actionLabel}
    />
  );
}

export function EmployeeAssignmentsState({
  title = "No active job assignments yet",
  description = "You do not have an active job assignment on file right now. Once the office or foreman assigns you to a job, time entry and upload workflows will open up automatically.",
  actionHref,
  actionLabel,
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <EmptyState
      icon="briefcase"
      title={title}
      description={description}
      actionHref={actionHref}
      actionLabel={actionLabel}
    />
  );
}
