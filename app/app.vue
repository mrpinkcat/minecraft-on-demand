<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
const { fetchUser } = useAuth();

onMounted(() => {
  fetchUser();
});
</script>

<style>
@import 'tailwindcss';
@import '@nuxt/ui';
</style>
