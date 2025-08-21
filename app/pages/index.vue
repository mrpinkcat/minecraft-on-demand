<template>
  <main>
    <h1>Accueil Minecraft On Demand</h1>

    <ULink v-if="!user" to="/api/auth/login" external as="button">
      <UButton>Login with Discord</UButton>
    </ULink>
    <ULink v-else to="/app">
      <UButton>Create a server as {{ user.username }}</UButton>
    </ULink>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'home',
});

const user = useUser();
</script>
