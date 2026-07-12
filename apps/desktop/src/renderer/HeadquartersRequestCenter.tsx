import type { HeadquartersAttentionRequest } from '@headquarters/hqos';
import {
  buildHeadquartersRequestWorkflow,
  type HeadquartersRequestWorkflowAction,
} from './HeadquartersRequestWorkflows';

export interface HeadquartersRequestCenterProps {
  readonly requests: readonly HeadquartersAttentionRequest[];
  readonly onAction?: ((requestId: string, action: HeadquartersRequestWorkflowAction) => void) | undefined;
}

const activeStatuses = new Set(['pending', 'surfaced', 'acknowledged', 'in_progress']);
const queuedStatuses = new Set(['queued']);
const resolvedStatuses = new Set(['resolved', 'dismissed', 'expired', 'superseded']);

export function HeadquartersRequestCenter({
  requests,
  onAction,
}: HeadquartersRequestCenterProps): JSX.Element {
  const active = requests.filter((request) => activeStatuses.has(request.status));
  const queued = requests.filter((request) => queuedStatuses.has(request.status));
  const deferred = requests.filter((request) => request.interruptionPolicy === 'queue_until_mission_complete' && request.status !== 'resolved');
  const resolved = requests.filter((request) => resolvedStatuses.has(request.status));
  const background = requests.filter((request) => request.urgency === 'background');
  const highest = [...requests].sort(compareRequests)[0];

  return (
    <section className="headquarters-request-center" aria-label="Headquarters Activity Request Center">
      <header className="headquarters-request-center__header">
        <p className="section-label">Headquarters Activity</p>
        <h3>Request Center</h3>
        <p>{highest ? `${highest.title}: ${highest.reason}` : 'No Headquarters request requires attention.'}</p>
      </header>

      <RequestSection title="Requires Attention" requests={active} onAction={onAction} />
      <RequestSection title="Queued" requests={queued} onAction={onAction} />
      <RequestSection title="Deferred" requests={dedupeRequests(deferred)} onAction={onAction} />
      <RequestSection title="Recently Resolved" requests={resolved} onAction={onAction} />
      <RequestSection title="Background Activity" requests={background} onAction={onAction} />
    </section>
  );
}

export function HeadquartersAttentionIndicator({
  requests,
}: {
  readonly requests: readonly HeadquartersAttentionRequest[];
}): JSX.Element {
  const active = requests.filter((request) => activeStatuses.has(request.status));
  const blocking = active.filter((request) => request.blocking);

  return (
    <aside className="headquarters-attention-indicator" aria-label="Headquarters attention indicator">
      <p className="section-label">Attention</p>
      <strong>{blocking.length > 0 ? 'Blocking request active' : active.length > 0 ? 'Requests queued' : 'Clear'}</strong>
      <span>{active.length} active / {blocking.length} blocking</span>
    </aside>
  );
}

function RequestSection({
  title,
  requests,
  onAction,
}: {
  readonly title: string;
  readonly requests: readonly HeadquartersAttentionRequest[];
  readonly onAction?: ((requestId: string, action: HeadquartersRequestWorkflowAction) => void) | undefined;
}): JSX.Element {
  return (
    <section className="headquarters-request-center__section" aria-label={title}>
      <h4>{title}</h4>
      {requests.length === 0 ? (
        <p className="muted">No {title.toLowerCase()}.</p>
      ) : (
        requests.map((request) => (
          <RequestCard key={request.requestId} request={request} onAction={onAction} />
        ))
      )}
    </section>
  );
}

function RequestCard({
  request,
  onAction,
}: {
  readonly request: HeadquartersAttentionRequest;
  readonly onAction?: ((requestId: string, action: HeadquartersRequestWorkflowAction) => void) | undefined;
}): JSX.Element {
  const workflow = buildHeadquartersRequestWorkflow(request);
  const primary = workflow.steps.find((step) => step.primary && step.enabled);
  const defer = workflow.steps.find((step) => step.action === 'defer' && step.enabled);
  const dismissAllowed = !request.blocking && request.status !== 'resolved';

  return (
    <article className={`headquarters-request-card urgency-${request.urgency}`}>
      <header>
        <span>{request.sourceSubsystem}</span>
        <strong>{request.title}</strong>
      </header>
      <p>{request.reason}</p>
      <dl>
        <div><dt>Urgency</dt><dd>{request.urgency}</dd></div>
        <div><dt>Room</dt><dd>{request.recommendedRoom}</dd></div>
        <div><dt>Action</dt><dd>{request.recommendedAction}</dd></div>
        <div><dt>Evidence</dt><dd>{workflow.evidenceSummary}</dd></div>
      </dl>
      <footer>
        {primary ? (
          <button type="button" onClick={() => onAction?.(request.requestId, primary.action)}>
            Review Now
          </button>
        ) : null}
        {defer ? (
          <button type="button" onClick={() => onAction?.(request.requestId, 'defer')}>
            Defer
          </button>
        ) : null}
        <button type="button" onClick={() => onAction?.(request.requestId, 'open_evidence')}>
          Open Evidence
        </button>
        {dismissAllowed ? (
          <button type="button" onClick={() => onAction?.(request.requestId, 'acknowledge')}>
            Dismiss
          </button>
        ) : (
          <span>Critical requests cannot be silently dismissed.</span>
        )}
      </footer>
    </article>
  );
}

function dedupeRequests(requests: readonly HeadquartersAttentionRequest[]): readonly HeadquartersAttentionRequest[] {
  return [...new Map(requests.map((request) => [request.requestId, request])).values()];
}

function compareRequests(left: HeadquartersAttentionRequest, right: HeadquartersAttentionRequest): number {
  const urgencyRank = { critical: 0, immediate: 1, soon: 2, routine: 3, background: 4 };
  return urgencyRank[left.urgency] - urgencyRank[right.urgency]
    || Number(right.blocking) - Number(left.blocking)
    || left.createdAt.localeCompare(right.createdAt);
}
