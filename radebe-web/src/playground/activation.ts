export type PlaygroundActivationLease = {
  release: () => void;
};

type PlaygroundActivationPriority = {
  distanceFromViewportPx: number;
  topPx: number;
  visible: boolean;
};

type PlaygroundActivationRequest = {
  token: number;
  getPriority: () => PlaygroundActivationPriority;
  grant: (lease: PlaygroundActivationLease) => void;
};

const MAX_CONCURRENT_STANDARD_PLAYGROUND_STARTS = 1;

const pendingPlaygroundActivations = new Map<number, PlaygroundActivationRequest>();
let activeStandardPlaygroundStarts = 0;
let nextPlaygroundActivationToken = 0;

export function getNowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function compareActivationRequests(
  left: PlaygroundActivationRequest,
  right: PlaygroundActivationRequest
): number {
  const leftPriority = left.getPriority();
  const rightPriority = right.getPriority();

  if (leftPriority.visible !== rightPriority.visible) {
    return leftPriority.visible ? -1 : 1;
  }

  if (leftPriority.visible && rightPriority.visible) {
    if (leftPriority.topPx !== rightPriority.topPx) {
      return leftPriority.topPx - rightPriority.topPx;
    }
  } else if (
    leftPriority.distanceFromViewportPx !== rightPriority.distanceFromViewportPx
  ) {
    return leftPriority.distanceFromViewportPx - rightPriority.distanceFromViewportPx;
  }

  return left.token - right.token;
}

function pumpPlaygroundActivationQueue(): void {
  while (
    activeStandardPlaygroundStarts < MAX_CONCURRENT_STANDARD_PLAYGROUND_STARTS &&
    pendingPlaygroundActivations.size > 0
  ) {
    const nextRequest = [...pendingPlaygroundActivations.values()].sort(
      compareActivationRequests
    )[0];

    if (!nextRequest) {
      return;
    }

    pendingPlaygroundActivations.delete(nextRequest.token);
    activeStandardPlaygroundStarts += 1;

    let released = false;
    const lease: PlaygroundActivationLease = {
      release: () => {
        if (released) {
          return;
        }

        released = true;
        activeStandardPlaygroundStarts = Math.max(
          activeStandardPlaygroundStarts - 1,
          0
        );
        pumpPlaygroundActivationQueue();
      }
    };

    nextRequest.grant(lease);
  }
}

export function requestPlaygroundActivation(
  request: Omit<PlaygroundActivationRequest, "token">
): {
  cancel: () => void;
  reprioritize: () => void;
} {
  const token = nextPlaygroundActivationToken;

  nextPlaygroundActivationToken += 1;
  pendingPlaygroundActivations.set(token, {
    ...request,
    token
  });
  pumpPlaygroundActivationQueue();

  return {
    cancel: () => {
      if (pendingPlaygroundActivations.delete(token)) {
        pumpPlaygroundActivationQueue();
      }
    },
    reprioritize: () => {
      pumpPlaygroundActivationQueue();
    }
  };
}
