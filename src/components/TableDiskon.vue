<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useSnackbar } from '../composables/useSnackbar';
import DiskonModal from '../components/DiskonModal.vue';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue'

const showModal = ref(false)
const items = ref([])
const discounts = ref([]) 
const selected = ref([])
const loading = ref(false)
const deleting = ref(false)
const searchQuery = ref('')
const { showSnackbar } = useSnackbar();

const showApiConfig = ref(false)
const apiUrlInput = ref('')
const selectedApi = ref('Kopi Anak Bangsa')
const baseUrl = ref(import.meta.env.VITE_API_BASE_URL)

// Inisialisasi header untuk tabel
const headers = [
  { title: '', key: 'checkbox', sortable: false, width: '50px' },
  { title: 'Nama Diskon', key: 'nama', sortable: true },
  { title: 'Nilai Diskon', key: 'nilai', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' }
]

// Fungsi untuk searching nama diskon
const filteredItems = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return items.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  
  return items.value.filter(item => {
    const namaDiskon = item.nama.toLowerCase()
    return namaDiskon.includes(query)
  })
})

// Fungsi untuk mendeteksi apakah semua checkbox tercentang
const allSelected = computed({
  get: () => selected.value.length === filteredItems.value.length && filteredItems.value.length > 0,
  set: (value) => {
    selected.value = value ? filteredItems.value.map(item => item.id) : []
  }
})

// Fungsi untuk menandai checkbox dicentang sebagian
const someSelected = computed(() => 
  selected.value.length > 0 && selected.value.length < filteredItems.value.length
)

// Format nilai untuk kolom diskon tabel
const formatNilai = (diskon, tipe) => {
  if (tipe === 'rupiah') {
    return `Rp ${diskon.toLocaleString('id-ID')}`
  } else if (tipe === 'persen') {
    return `${diskon}%`
  }
  return '-'
}

// Fungsi untuk menampilkan form api url
const handleApiChange = () => {
  showApiConfig.value = !showApiConfig.value
  if (showApiConfig.value) {
    apiUrlInput.value = baseUrl.value
  }
}

// FUngsi untuk memproses submit api url
const applyApiUrl = async () => {
  if (!apiUrlInput.value.trim()) {
    showSnackbar('URL API tidak boleh kosong', 'error')
    return
  }
  console.log(apiUrlInput.value.trim());
  baseUrl.value = apiUrlInput.value.trim()
  showApiConfig.value = false
  showSnackbar('URL API berhasil diubah', 'success')
  
  await fetchData()
}

// Fungsi get data tabel
const fetchData = async () => {
  loading.value = true
  try {
    const response = await fetch(baseUrl.value)
    
    if (!response.ok) {
      throw new Error('Gagal mengambil data')
    }
    
    const data = await response.json()
    discounts.value = data 
    
    // Menandai data diskon terbaru
    let latestCreatedAt = null
    if (data.length > 0) {
      latestCreatedAt = data.reduce((latest, item) => {
        const itemDate = new Date(item.created_at)
        return !latest || itemDate > new Date(latest) ? item.created_at : latest
      }, null)
    }
    
    items.value = data.map(item => ({
      id: item._id,
      nama: item.nama_diskon,
      nilai: formatNilai(item.diskon, item.tipe),
      isBaru: item.created_at === latestCreatedAt,
      rawData: item
    })).sort((a, b) => {
        const dateA = new Date(a.rawData.created_at)
        const dateB = new Date(b.rawData.created_at)
        return dateB - dateA
      })
  } catch (error) {
    console.error('Error fetching data:', error)
    showSnackbar('Gagal memuat data dari API', 'error')
  } finally {
    loading.value = false
  }
}

// Fungsi untuk post data ke API (simpan data)
const handleSaveDiskon = async (data) => {
  try {
    const payload = {
      nama_diskon: data.namaDiskon,
      diskon: data.diskon.toString(),
      tipe: data.type,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    const response = await axios.post(baseUrl.value, payload)

    showSnackbar('Discount berhasil ditambahkan.', 'success')
    await fetchData() 
  } catch (error) {
    console.error('Error saat menyimpan diskon:', error)
    
    showSnackbar(
      error.response?.data?.message || 'Gagal menambahkan discount.', 
      'error'
    )
  }
}

// Fungsi untuk edit data diskon
const handleEdit = (item) => {
  alert(`Edit: ${item.nama}`)
  console.log('Data asli:', item.rawData)
}

// Fungsi untuk DELETE data ke api
const handleDelete = async () => {
  if (selected.value.length === 0) return
  showModal.value = false
  deleting.value = true

  try {
    const deletePromises = selected.value.map(id => 
      fetch(`${baseUrl.value}/${id}`, {
        method: 'DELETE'
      })
    )
    
    const results = await Promise.all(deletePromises)
    
    const failedCount = results.filter(r => !r.ok).length
    
    if (failedCount === 0) {
      showSnackbar(`${selected.value.length} diskon berhasil dihapus`, 'success')
      selected.value = []
      await fetchData() 
    } else {
      showSnackbar(`Gagal menghapus ${failedCount} diskon`, 'error')
    }
  } catch (error) {
    console.error('Error deleting items:', error)
    showSnackbar('Terjadi kesalahan saat menghapus diskon', 'error')
  } finally {
    deleting.value = false
  }
}

const handleCancel = () => {
  selected.value = []
}

const clearSearch = () => {
  searchQuery.value = ''
}

const isSelected = (itemId) => selected.value.includes(itemId)

const toggleItem = (itemId) => {
  const index = selected.value.indexOf(itemId)
  if (index > -1) {
    selected.value.splice(index, 1)
  } else {
    selected.value.push(itemId)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <v-app>
    <ConfirmDeleteModal
      :show="showModal"
      :discount-name="selected[0]?.name || 'Discount Name'"
      @close="showModal = false"
      @confirm="handleDelete"/>

    <v-main class="pa-6">
      <v-card rounded="xl">
       <v-card-title class="d-flex align-start">
            <div class="d-flex flex-column flex-grow-1 mr-4">
                <span class="text-h6">Daftar Diskon</span>
                <span class="text-body-2 text-grey">
                Total Diskon: {{ items.length }}
                </span>
                
                <div class="search-container mt-4 d-flex gap-2">
                  <v-text-field
                    v-model="searchQuery"
                    label="Cari diskon..."
                    placeholder="Ketik nama diskon..."
                    variant="outlined"
                    density="comfortable"
                    rounded="xl"
                    clearable
                    hide-details
                    @click:clear="clearSearch"
                    class="search-field flex-grow-1">
                    <template v-slot:prepend-inner>
                      <v-icon color="grey-darken-1">mdi-magnify</v-icon>
                    </template>
                    <template v-slot:append-inner v-if="searchQuery">
                      <v-chip
                        size="small"
                        color="primary"
                        variant="flat"
                        class="mr-2">
                        {{ filteredItems.length }} hasil
                      </v-chip>
                    </template>
                  </v-text-field>

                  <v-btn
                    variant="outlined"
                    rounded="xl"
                    density="comfortable"
                    @click="handleApiChange"
                    class="api-selector-btn">
                    <v-icon start>mdi-coffee</v-icon>
                    {{ selectedApi }}
                    <v-icon end>{{ showApiConfig ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </v-btn>
                </div>

                <v-expand-transition>
                  <v-card
                    v-if="showApiConfig"
                    class="mt-3 pa-4"
                    variant="outlined"
                    rounded="lg">
                    <div class="text-subtitle-2 mb-3">API URL crudcrud.com</div>
                    <v-text-field
                      v-model="apiUrlInput"
                      label="API URL"
                      placeholder="https://crudcrud.com/api/bc0c.../diskon"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="mb-3">
                    </v-text-field>
                    <v-btn
                      color="success"
                      rounded="lg"
                      @click="applyApiUrl"
                      block>
                      Terapkan
                    </v-btn>
                  </v-card>
                </v-expand-transition>
            </div>

            <div>
                <div v-if="selected.length === 0">
                 <DiskonModal ref="diskonModalRef" :existing-discounts="discounts" @save="handleSaveDiskon"/>
            </div>

                <div v-else class="d-flex gap-2">
                <v-btn
                    color="error"
                    rounded="xl"
                    @click="showModal = true"
                    :loading="deleting"
                    :disabled="deleting">
                    <v-icon start>mdi-delete</v-icon>
                    Hapus ({{ selected.length }})
                </v-btn>

                <v-btn
                    color="grey"
                    variant="outlined"
                    rounded="xl"
                    @click="handleCancel()"
                    :disabled="deleting">
                    <v-icon start>mdi-close</v-icon>
                    Batalkan
                </v-btn>
                </div>
            </div>
        </v-card-title>

        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :items-per-page="10"
          :loading="loading"
          class="elevation-1">
          <template v-slot:header.checkbox>
            <v-checkbox
              :model-value="allSelected"
              :indeterminate="someSelected"
              @update:model-value="allSelected = $event"
              hide-details
              density="compact"
              color="primary">
            </v-checkbox>
          </template>
          
          <template v-slot:item="{ item }">
            <tr>
              <td>
                <v-checkbox
                  :model-value="isSelected(item.id)"
                  @update:model-value="toggleItem(item.id)"
                  hide-details
                  density="compact"
                  color="primary">
                </v-checkbox>
              </td>
              <td>
                <div class="d-flex align-center">
                  {{ item.nama }}
                  <v-chip
                    v-if="item.isBaru"
                    size="x-small"
                    color="blue"
                    class="ml-2">
                    baru
                  </v-chip>
                </div>
              </td>
              <td>
                {{ item.nilai }}
              </td>
              <td class="text-right">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="handleEdit(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>
          
          <template v-slot:no-data>
            <div class="text-center pa-4">
              <v-icon size="48" color="grey">mdi-database-off</v-icon>
              <p class="mt-2">
                {{ searchQuery ? 'Tidak ada hasil pencarian' : 'Tidak ada data' }}
              </p>
              <v-btn
                v-if="searchQuery"
                color="primary"
                variant="text"
                @click="clearSearch"
                class="mt-2">
                Hapus Pencarian
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-main>
  </v-app>
</template>

<style scoped>
:deep(.v-data-table) {
  background-color: #fafafa;
}

:deep(th) {
  background-color: #f9fafa !important;
  font-weight: 500 !important;
}

:deep(tr:hover) {
  background-color: #f5f5f5 !important;
}

.gap-2 {
  gap: 8px;
}

.search-container {
  width: 100%;
  max-width: 600px;
}

.search-field {
  background-color: white;
  border-radius: 12px;
}

.search-field :deep(.v-field) {
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-field :deep(.v-field--focused) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.search-field :deep(.v-field__input) {
  padding: 8px 0;
}

.api-selector-btn {
  min-width: 200px;
  white-space: nowrap;
}
</style>