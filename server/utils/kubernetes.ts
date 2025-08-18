import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';

const kc = new KubeConfig();
kc.loadFromFile('kubeconfig'); // Adjust the path to your kubeconfig file if necessary

console.log(
  'Kubernetes client initialized with context:',
  kc.getCurrentContext()
);

const k8sApi = kc.makeApiClient(CoreV1Api);

export { k8sApi };
