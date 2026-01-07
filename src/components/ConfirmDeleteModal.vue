<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h3 class="modal-title">Hapus Diskon</h3>
      <p class="modal-message">
        Apakah Anda yakin ingin menghapus data diskon?
      </p>
      <p class="modal-warning">
        • Diskon yang dihapus tidak bisa dikembalikan lagi.
      </p>
      
      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-cancel">
          Batalkan
        </button>
        <button @click="$emit('confirm')" class="btn-confirm">
          Hapus
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Menerima data boolean untuk show modal konfirmasi
defineProps({
  show: Boolean,
  discountName: String
})

defineEmits(['close', 'confirm'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #ffffff;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  border-radius: 20px; 
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.modal-title {
  margin-bottom: 12px;
  font-size: 18px;
}

.modal-message {
  margin-bottom: 8px;
}

.modal-warning {
  color: #777;
  font-size: 14px;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

button {
  padding: 8px 16px;
  border-radius: 12px; 
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel {
  background: #e0e0e0;
  color: #333;
}

.btn-confirm {
  background: #d32f2f;
  color: white;
}
</style>