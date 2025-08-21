<template>
  <div>
    <h1>Minecraft On Demand APP</h1>
    <UButton @click="logout">Logout</UButton>
    <UAvatar v-if="user" :src="avatarUrl" />
    <p v-if="user">{{ user.username }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'dashboard',
});

const user = useUser();

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' });
  user.value = undefined;
  useRouter().push('/');
}

const avatarUrl = computed(() =>
  user.value?.avatarId
    ? `https://cdn.discordapp.com/avatars/${user.value.id}/${user.value.avatarId}.png`
    : undefined
);
</script>
