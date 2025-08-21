import { V1Namespace } from '@kubernetes/client-node';
import type { H3EventContext } from 'h3';

export async function getUserNamespace(
  context: H3EventContext
): Promise<V1Namespace | null> {
  if (!context.user) {
    throw new Error('Cannot get namespace without user context');
  }
  if (!context.user.namespace) {
    console.log(
      `[SERVER - k9s namespace] User ${context.user.id} does not have a namespace defined.`
    );
    return null;
  }

  // Attempt to read the namespace
  try {
    return await k8sApi.readNamespace({ name: context.user.namespace });
  } catch (error) {
    console.error(
      `[SERVER - k9s namespace] Namespace ${context.user.namespace} does not exist.`,
      error
    );
    return null;
  }
}

export async function createUserNamespace(
  context: H3EventContext
): Promise<V1Namespace> {
  if (!context.user) {
    throw new Error('Cannot create namespace without user context');
  }
  const namespaceName = context.user.id;

  // Check if the namespace already exists
  const existingNamespace = await getUserNamespace(context);
  if (existingNamespace) {
    console.log(
      `[SERVER - k9s namespace] Namespace ${namespaceName} already exists.`
    );
    return existingNamespace;
  }

  console.log(`[SERVER - k9s namespace] Creating namespace: ${namespaceName}`);
  return await k8sApi.createNamespace({
    body: {
      metadata: {
        name: namespaceName,
        labels: {
          owner: context.user.id,
        },
      },
    },
  });
}
