<template>
  <main>
    <h1>Accueil Minecraft On Demand</h1>

    <DiscordLogin v-if="!user" />
    <NuxtLink v-else to="/app">
      <button>Create a server as {{ user.username }}</button>
    </NuxtLink>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'home',
});

const user = useUser();
</script>
