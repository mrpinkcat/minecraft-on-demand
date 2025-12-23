<template>
  <NuxtLink to="/api/auth/login" external as="button">
    <button>
      Login with Discord
      <Icon name="simple-icons:discord" width="20" height="20" style="margin-left: 0.5rem;" />
    </button>
  </NuxtLink>
</template>

<style scoped>
button {
  background-color: rgb(58, 67, 164);
  border: unset;
  border: solid 1px rbg(88, 101, 242);
  color: #FFF;
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;

  &:hover {
    background-color: rgb(88, 101, 242);
  }
}
</style>
