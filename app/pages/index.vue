<template>
  <div>
    <h1>Minecraft On Demand</h1>
    <UButton> Create </UButton>
    <ULink v-if="!user" to="/api/auth/login" external>
      <UButton> Login </UButton>
    </ULink>
    <UButton v-else @click="logout"> Logout </UButton>
    <code>
      <pre>
        {{ message?.items.map((namespace) => namespace.metadata?.name) }}
      </pre>
    </code>
  </div>
</template>

<script setup lang="ts">
import type { V1NamespaceList } from '@kubernetes/client-node';

const message = ref<V1NamespaceList>();
const { user, logout } = useAuth();

try {
  console.log('Fetching server message...');
  const { data, error } = await useFetch<V1NamespaceList>('/api/test');
  if (error.value) {
    throw new Error(`Error fetching data: ${error.value.message}`);
  }
  if (!data.value) {
    throw new Error('No data received from server');
  }
  message.value = data.value;
} catch (error) {
  console.error('Error fetching server message:', error);
}
</script>
