<template>
  <div>
    <h1>Minecraft On Demand</h1>
    <UButton> Create </UButton>
    {{ message }}
  </div>
</template>

<script setup lang="ts">
const message = ref('');

try {
  console.log('Fetching server message...');
  const { data, error } = await useFetch<{ message: string }>('/api/test', {
    server: true,
  });
  if (error.value) {
    throw new Error(`Error fetching data: ${error.value.message}`);
  }
  if (!data.value) {
    throw new Error('No data received from server');
  }
  message.value = data.value.message;
} catch (error) {
  console.error('Error fetching server message:', error);
}
</script>
