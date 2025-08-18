import { k8sApi } from '~~/server/utils/kubernetes';
import type { V1NamespaceList } from '@kubernetes/client-node';

export default defineEventHandler(async () => {
  const namespaces: V1NamespaceList = await k8sApi.listNamespace();
  return namespaces;
});
