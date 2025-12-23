package main

import (
	"context"
	"log"
	"path/filepath"
	"slices"

	agonesv1 "agones.dev/agones/pkg/apis/agones/v1"
	"agones.dev/agones/pkg/client/clientset/versioned"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func SetupNamespace(kubernetesClient *kubernetes.Clientset) {
	log.Print("Creation du namespace gameserver")
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: "gameserver",
			Labels: map[string]string{
				"agones.dev/role": "gameservers",
			},
		},
	}
	kubernetesClient.CoreV1().Namespaces().Create(context.TODO(), ns, metav1.CreateOptions{})
	log.Print("Namespace gameserver créé")
}

func createSimpleGameserver(agonesClient *versioned.Clientset) {
	log.Print("Creation simple gameserver")
	gs := &agonesv1.GameServer{
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: "example-server-",
			Namespace:    "gameserver",
			Labels: map[string]string{
				"game":  "example",
				"owner": "gatien",
			},
		},
		Spec: agonesv1.GameServerSpec{
			Ports: []agonesv1.GameServerPort{
				{
					Name: "default",
					// PortPolicy:    "Dynamic",
					ContainerPort: 7654,
				},
			},
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{{
						Name:  "example-gameserver",
						Image: "us-docker.pkg.dev/agones-images/examples/simple-game-server:0.39",
					}},
				},
			},
		},
	}
	gs, err := agonesClient.AgonesV1().GameServers("gameserver").Create(context.TODO(), gs, metav1.CreateOptions{})
	if err != nil {
		log.Fatal("Echec de creation du gameserver", err)
	}
	log.Printf("Gameserver %s create", gs.Name)

}

func main() {
	// 1. Connexion au cluster (utilise ton fichier kubeconfig local)
	kubeconfig := filepath.Join("./kubeconfig")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		log.Fatalf("Erreur de config cluster: %v", err)
	}

	// Creation du client k8s
	kubernetesClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("Erreur de config kubernetes: %v", err)
	}

	// Vérification et création du namespace si il n'existe pas
	nsList, err := kubernetesClient.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		log.Fatalf("Erreur de récupération des namespaces: %v", err)
	}
	exists := slices.ContainsFunc(nsList.Items, func(ns corev1.Namespace) bool {
		return ns.Name == "gameserver"
	})
	if !exists {
		SetupNamespace(kubernetesClient)
	} else {
		log.Print("Namespace gameserver déjà créé")
	}

	// 2. Création du client Agones
	agonesClient, err := versioned.NewForConfig(config)
	if err != nil {
		log.Fatalf("Erreur lors de la création du client Agones: %v", err)
	}

	createSimpleGameserver(agonesClient)

	// 3. Test de lecture : Lister les serveurs de jeux
	// log.Println("=== Backend Game Hosting connecté ===")

	// list, err := agonesClient.AgonesV1().GameServers("gameserver").List(context.TODO(), metav1.ListOptions{})
	// if err != nil {
	// 	log.Fatalf("Erreur de lecture : %v", err)
	// }

	// log.Printf("Nombre de serveurs actifs sur le cluster : %d\n", len(list.Items))

	// for _, gs := range list.Items {
	// 	if gs.Status.State == agonesv1.GameServerStateError {
	// 		log.Printf("- Serveur: %s | État: ERROR", gs.Name)
	// 	} else {
	// 		log.Printf("- Serveur: %s | État: %s | IP: %s:%d\n", gs.Name, gs.Status.State, gs.Status.Address, gs.Status.Ports[len(gs.Status.Ports)-1].Port)
	// 	}
	// }
}
