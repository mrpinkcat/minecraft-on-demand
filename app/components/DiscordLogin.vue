<template>
  <NuxtLink to="/api/auth/login" external as="button">
    <button>Login with Discord</button>
  </NuxtLink>
</template>

<style scoped>
button {
  background-color: rgb(58, 67, 164);
  border: solid 1px rbg(88, 101, 242);
  color: var(--color-white);

  &:hover {
    background-color: rgb(88, 101, 242);
  }
}
</style>
