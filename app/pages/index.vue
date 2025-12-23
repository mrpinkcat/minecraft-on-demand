<template>
  <main>
    <section class="hero">
      <BackgroundDither
        class="background"
        :color-num="4"
        :pixel-size="3"
        :enable-mouse-interaction="false"
        :wave-color="[0.1, 0.7, 0.5]"
      />
      <div class="content">
        <h1>Minecraft On Demand</h1>
        <p>Instantly create and manage your own Minecraft server with ease.</p>
        <DiscordLogin v-if="!user" />
        <NuxtLink v-else to="/app">
          <button>Create a server as {{ user.username }}</button>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'home',
  layout: 'external',
});

const user = useUser();
</script>

<style scoped>
main {
  margin: 0 auto;
  border-bottom: solid 1px var(--border-primary);

  section {
    max-width: var(--front-main-width);
    margin: 0 auto;
    border-left: solid 1px var(--border-primary);
    border-right: solid 1px var(--border-primary);

    &.hero {
      position: relative;
      overflow: hidden;

      .background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .content {
        position: relative;
        z-index: 1;
        padding: 6rem 1rem;
        text-align: center;
        color: var(--text-primary);
      }
    }
  }
}
</style>
