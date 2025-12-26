package main

import (
	"context"
	"fmt"
	"log"
	"path/filepath"
	"time"

	agonesv1 "agones.dev/agones/pkg/apis/agones/v1"
	"agones.dev/agones/pkg/client/clientset/versioned"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

var nsName = "gameserver"

func SetupNamespace(kubernetesClient *kubernetes.Clientset) {
	log.Print("Creation du namespace gameserver")
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: nsName,
			Labels: map[string]string{
				"agones.dev/role": "gameservers",
			},
		},
	}
	kubernetesClient.CoreV1().Namespaces().Create(context.TODO(), ns, metav1.CreateOptions{})
	log.Print("Namespace gameserver créé")
}

func watchGameServerReady(agonesClient *versioned.Clientset, gsName string) error {
	log.Printf("Abonnement aux événements pour : %s", gsName)

	// 1. On définit un timeout pour ne pas attendre éternellement
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// 2. On configure le Watch avec un filtre sur le nom du serveur
	opts := metav1.ListOptions{
		FieldSelector: fmt.Sprintf("metadata.name=%s", gsName),
	}

	watcher, err := agonesClient.AgonesV1().GameServers(nsName).Watch(ctx, opts)
	if err != nil {
		return err
	}
	defer watcher.Stop() // Très important de fermer le flux à la fin

	// 3. On boucle sur le canal d'événements
	for event := range watcher.ResultChan() {
		gs, ok := event.Object.(*agonesv1.GameServer)
		if !ok {
			continue
		}

		switch gs.Status.State {
		case agonesv1.GameServerStateReady:
			log.Printf("Notification reçue : %s est enfin READY !", gs.Name)
			return nil
		case agonesv1.GameServerStateError:
			return fmt.Errorf("le serveur est passé en état d'erreur : %s", gs.Status.State)
		default:
			log.Printf("Mise à jour reçue : %s est en état %s", gs.Name, gs.Status.State)
		}
	}

	return fmt.Errorf("le flux s'est fermé sans que le serveur soit prêt")
}

func createSimpleGameserver(agonesClient *versioned.Clientset) (gs *agonesv1.GameServer) {
	log.Print("Creation simple gameserver")
	gs = &agonesv1.GameServer{
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: "example-server-",
			Namespace:    nsName,
			Labels: map[string]string{
				"game":  "example",
				"owner": "gatien",
			},
		},
		Spec: agonesv1.GameServerSpec{
			Ports: []agonesv1.GameServerPort{
				{
					Name:          "default",
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
	gs, err := agonesClient.AgonesV1().GameServers(nsName).Create(context.TODO(), gs, metav1.CreateOptions{})
	if err != nil {
		log.Fatal("Echec de creation du gameserver", err)
	}
	log.Printf("Gameserver %s create", gs.Name)
	return gs
}

func createMinecraftGameserver(agonesClient *versioned.Clientset) (gs *agonesv1.GameServer) {
	limitMemory := "1.5Gi"
	requestMemory := "1Gi"
	cpuRequest := "500m"
	rconPassword := "gatienbg"

	// Le script Bash injecté dans le container Alpine
	// On utilise 'nc' (netcat) pour vérifier le port et 'curl' pour parler à Agones
	bashScript := `
      apk add --no-cache curl;
      echo "Démarrage de la surveillance...";

      # 1. Lancer les pings de santé en arrière-plan
      (
        while true; do
          curl -s -X POST http://localhost:9358/health -d '{}';
          sleep 5;
        done
      ) &

      # 2. Attendre que le port Minecraft (25565) soit ouvert
      echo "Attente du port 25565...";
      while ! nc -z localhost 25565; do
        sleep 2;
      done

      # 3. Envoyer le signal Ready à Agones
      echo "Minecraft est prêt ! Signalement à Agones...";
      curl -s -X POST http://localhost:9358/ready -d '{}';

      # Maintenir le container en vie
      wait
  `

	log.Print("Creation Minecraft gameserver")
	gs = &agonesv1.GameServer{
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: "minecraft-server-",
			Namespace:    nsName,
			Labels: map[string]string{
				"game":  "minecraft",
				"owner": "gatien",
			},
		},
		Spec: agonesv1.GameServerSpec{
			Container: "minecraft-gameserver",
			Ports: []agonesv1.GameServerPort{
				{
					Name:          "game",
					ContainerPort: 25565,
					Protocol:      corev1.ProtocolTCP,
				},
			},
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "minecraft-gameserver",
							Image: "itzg/minecraft-server:latest",
							Env: []corev1.EnvVar{
								{Name: "EULA", Value: "TRUE"},
								// {Name: "TYPE", Value: "PAPER"},
								{Name: "MAX_PLAYERS", Value: "10"},
								{Name: "MEMORY", Value: "1G"},
								{Name: "VIEW_DISTANCE", Value: "6"},
								{Name: "RCON_ENABLED", Value: "true"},
								{Name: "RCON_PASSWORD", Value: rconPassword},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse(cpuRequest),
									corev1.ResourceMemory: resource.MustParse(requestMemory),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: resource.MustParse(limitMemory),
								},
							},
							Ports: []corev1.ContainerPort{
								{
									Name:          "game",
									ContainerPort: 25565,
								},
							},
						},
						{
							Name:    "agones-monitor",
							Image:   "alpine:latest",
							Command: []string{"/bin/sh", "-c"},
							Args:    []string{bashScript},
						},
					},
				},
			},
		},
	}
	gs, err := agonesClient.AgonesV1().GameServers(nsName).Create(context.TODO(), gs, metav1.CreateOptions{})
	if err != nil {
		log.Fatal("Echec de creation du gameserver", err)
	}
	log.Printf("Gameserver %s create", gs.Name)
	return gs
}

func main() {
	// 1. Connexion au cluster (utilise ton fichier kubeconfig local)
	kubeconfig := filepath.Join("./kubeconfig")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		log.Fatalf("Erreur de config cluster: %v", err)
	}

	// Creation du client k8s
	// kubernetesClient, err := kubernetes.NewForConfig(config)
	// if err != nil {
	// 	log.Fatalf("Erreur de config kubernetes: %v", err)
	// }

	// 2. Création du client Agones
	agonesClient, err := versioned.NewForConfig(config)
	if err != nil {
		log.Fatalf("Erreur lors de la création du client Agones: %v", err)
	}

	gs := createMinecraftGameserver(agonesClient)
	watchGameServerReady(agonesClient, gs.Name)

	// 3. Test de lecture : Lister les serveurs de jeux
	log.Println("=== Backend Game Hosting connecté ===")

	list, err := agonesClient.AgonesV1().GameServers("gameserver").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		log.Fatalf("Erreur de lecture : %v", err)
	}

	log.Printf("Nombre de serveurs actifs sur le cluster : %d\n", len(list.Items))

	for _, gs := range list.Items {
		if gs.Status.State == agonesv1.GameServerStateError {
			log.Printf("- Serveur: %s | État: ERROR", gs.Name)
		} else {
			log.Printf("- Serveur: %s | État: %s | IP: %s:%d\n", gs.Name, gs.Status.State, gs.Status.Address, gs.Status.Ports[len(gs.Status.Ports)-1].Port)
		}
	}
}
