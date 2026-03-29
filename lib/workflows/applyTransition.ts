import { runTransitionGuards } from "@/lib/workflows/guards";
import { findTransition, getFamilyTransitions } from "@/lib/workflows/transitions";
import type {
  TransitionCheckResult,
  TransitionGuardContext,
  WorkflowFamily,
  WorkflowStatusByFamily,
} from "@/lib/workflows/transitionTypes";

export function canTransition<F extends WorkflowFamily>(
  family: F,
  fromStatus: WorkflowStatusByFamily[F],
  toStatus: WorkflowStatusByFamily[F],
  context: TransitionGuardContext = {},
): TransitionCheckResult<F> {
  const transition = findTransition(family, fromStatus, toStatus);

  if (!transition) {
    return {
      allowed: false,
      reason: `Illegal ${family} transition from ${fromStatus} to ${toStatus}.`,
    };
  }

  const guardResult = runTransitionGuards(transition.guards, context);
  if (!guardResult.ok) {
    return {
      allowed: false,
      transition,
      reason: guardResult.reason,
    };
  }

  return {
    allowed: true,
    transition,
  };
}

export function getAllowedTransitions<F extends WorkflowFamily>(
  family: F,
  currentStatus: WorkflowStatusByFamily[F],
  context: TransitionGuardContext = {},
) {
  return getFamilyTransitions(family)
    .filter((transition) => transition.fromStatus === currentStatus)
    .map((transition) => ({
      transition,
      ...canTransition(family, currentStatus, transition.toStatus, context),
    }));
}

export function applyWorkflowTransition<F extends WorkflowFamily>(input: {
  family: F;
  fromStatus: WorkflowStatusByFamily[F];
  toStatus: WorkflowStatusByFamily[F];
  context?: TransitionGuardContext;
}) {
  const result = canTransition(
    input.family,
    input.fromStatus,
    input.toStatus,
    input.context,
  );

  if (!result.allowed || !result.transition) {
    throw new Error(
      result.reason ??
        `Illegal ${input.family} transition from ${input.fromStatus} to ${input.toStatus}.`,
    );
  }

  return {
    nextStatus: result.transition.toStatus,
    emittedEvents: result.transition.emittedEvents,
    sideEffects: result.transition.sideEffects,
    trigger: result.transition.trigger,
    actorType: result.transition.actorType,
    requiredConditions: result.transition.requiredConditions,
  };
}
