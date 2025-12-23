# Gameserver manager

## Setup k8s

On peut utiliser k3sup pour créer le cluster kube et récupérer le kubeconfig `k3sup install --ip 192.168.1.251 --user gatien --context lab --k3s-extra-args "--write-kubeconfig-mode=644"`

### Install agones

1. Installer la helmchart `KUBECONFIG=./kubeconfig helm install gameserver-manager --namespace agones-system --create-namespace agones/agones`
2. Créer le namespace `KUBECONFIG=./kubeconfig kubectl create namespace gameserver`
3. Updatez la helmchart `KUBECONFIG=./kubeconfig helm upgrade gameserver-manager agones/agones --reuse-values --set "gameservers.namespaces={gameserver}" --namespace agones-system`
