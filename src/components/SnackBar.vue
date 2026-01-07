<template>
  <v-snackbar
    v-model="snackbar.show"
    :timeout="snackbar.timeout"
    :color="snackbar.color"
    location="top"
    rounded="pill"
  >
    {{ snackbar.text }}
    
    <template v-slot:actions>
      <v-btn
        variant="text"
        size="small"
        @click="snackbar.show = false"
      >
        Tutup
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useSnackbar } from '../composables/useSnackbar';

const { snackbar } = useSnackbar();
</script>