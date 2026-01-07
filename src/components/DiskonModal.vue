<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" rounded="xl" color="success">
        <v-icon start>mdi-plus</v-icon>
        Tambah Diskon
      </v-btn>
    </template>

    <v-card rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <span class="text-h6">Tambah Diskon</span>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-form ref="form" @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">Nama Diskon</label>
            <v-text-field
              v-model="formData.namaDiskon"
              placeholder="Misal: Diskon opening, diskon akhir tahun"
              variant="outlined"
              density="comfortable"
              :error-messages="errors.namaDiskon"
              hide-details="auto"></v-text-field>
          </div>

          <div>
            <label class="text-subtitle-2 mb-2 d-block">Diskon</label>
            <div class="d-flex align-center ga-2">
              <v-text-field
                v-model="formData.diskon"
                type="number"
                variant="outlined"
                density="comfortable"
                :suffix="diskonType === 'persen' ? '%' : ''"
                :error-messages="errors.diskon"
                hide-details="auto"
                class="flex-grow-1"></v-text-field>

              <v-btn-toggle
                v-model="diskonType"
                mandatory
                color="success"
                density="comfortable">
                <v-btn value="persen" size="small">
                  <v-icon>mdi-percent</v-icon>
                </v-btn>
                <v-btn value="rupiah" size="small">
                  Rp
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-btn
          color="success"
          variant="flat"
          block
          size="large"
          @click="handleSubmit">
          Simpan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'

const dialog = ref(false)
const form = ref(null)
const diskonType = ref('persen')

// Menerima data diskon untuk validasi nama diskon UNIK
const props = defineProps({
  existingDiscounts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save'])

const formData = reactive({
  namaDiskon: '',
  diskon: 0
})

const errors = reactive({
  namaDiskon: '',
  diskon: ''
})

// Validasi form required dan duplikat nama diskon
const validateForm = () => {
  let isValid = true
  
  errors.namaDiskon = ''
  errors.diskon = ''

  if (!formData.namaDiskon || formData.namaDiskon.trim() === '') {
    errors.namaDiskon = 'Nama diskon tidak boleh kosong.'
    isValid = false
  } else {
    const isDuplicate = props.existingDiscounts.some(
      discount => discount.nama_diskon.toLowerCase() === formData.namaDiskon.trim().toLowerCase()
    )

    if (isDuplicate) {
      errors.namaDiskon = 'Nama diskon sudah digunakan. Gunakan nama lain.'
      isValid = false
    }
  }

  if (!formData.diskon || formData.diskon <= 0) {
    errors.diskon = 'Diskon tidak boleh kosong.'
    isValid = false
  }

  return isValid
}

// Fungsi untuk menghandle submit dari form
const handleSubmit = () => {
  if (validateForm()) {
    const result = {
      namaDiskon: formData.namaDiskon.trim(),
      diskon: formData.diskon,
      type: diskonType.value
    }
    
    emit('save', result)
    closeDialog()
  }
}

const closeDialog = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.namaDiskon = ''
  formData.diskon = 0
  diskonType.value = 'persen'
  errors.namaDiskon = ''
  errors.diskon = ''
}
</script>

<style scoped>
.v-card-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

:deep(.v-input--error .v-field) {
  border-color: #f44336 !important;
}

:deep(.v-messages__message) {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}
</style>