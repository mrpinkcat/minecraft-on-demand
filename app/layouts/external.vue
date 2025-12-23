<template>
  <div class="layout-external">
    <FrontHeader />
    <slot />
    <FrontFooter />
  </div>
</template>

<style scoped>
.layout-external {
  background-color: var(--background-primary);
}
</style>

<style>
html,
body {
  background-color: var(--background-primary);
}
</style>
