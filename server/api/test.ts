import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';

const kc = new KubeConfig();
kc.loadFromDefault();
// kc.

const k8sApi = kc.makeApiClient(CoreV1Api);

k8sApi.listNamespacedPod({ namespace: 'default' }).then((res) => {
  console.log(res);
});

export default defineEventHandler(() => {
  return {
    message: 'Hello from the server!',
  };
});
