<script setup>
import TableDiskon from './components/TableDiskon.vue';
import AppSnackbar from './components/SnackBar.vue';
</script>

<template>
  <v-app>
    <AppSnackbar />
    <v-main class="pa-6">
      <TableDiskon />
    </v-main>
  </v-app>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
