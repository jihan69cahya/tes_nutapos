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
const { showSnackbar } = useSnackbar();
const baseUrl = import.meta.env.VITE_API_BASE_URL

const headers = [
  { title: '', key: 'checkbox', sortable: false, width: '50px' },
  { title: 'Nama Diskon', key: 'nama', sortable: true },
  { title: 'Nilai Diskon', key: 'nilai', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' }
]

const allSelected = computed({
  get: () => selected.value.length === items.value.length && items.value.length > 0,
  set: (value) => {
    selected.value = value ? items.value.map(item => item.id) : []
  }
})

const someSelected = computed(() => 
  selected.value.length > 0 && selected.value.length < items.value.length
)

const formatNilai = (diskon, tipe) => {
  if (tipe === 'rupiah') {
    return `Rp ${diskon.toLocaleString('id-ID')}`
  } else if (tipe === 'persen') {
    return `${diskon}%`
  }
  return '-'
}

const fetchData = async () => {
  loading.value = true
  try {
    const response = await fetch(baseUrl)
    
    if (!response.ok) {
      throw new Error('Gagal mengambil data')
    }
    
    const data = await response.json()
    discounts.value = data 
    
    // Cari data dengan created_at terbaru
    let latestCreatedAt = null
    if (data.length > 0) {
      latestCreatedAt = data.reduce((latest, item) => {
        const itemDate = new Date(item.created_at)
        return !latest || itemDate > new Date(latest) ? item.created_at : latest
      }, null)
    }
    
    // Transform data dari API ke format yang dibutuhkan
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

const handleSaveDiskon = async (data) => {
  try {
    // Format data sesuai API
    const payload = {
      nama_diskon: data.namaDiskon,
      diskon: data.diskon.toString(),
      tipe: data.type,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }

    console.log('Payload yang dikirim:', payload)

    // POST ke API
    const response = await axios.post(baseUrl, payload)

    console.log('Response dari API:', response.data)

    // Tampilkan notifikasi sukses
    showSnackbar('Discount berhasil ditambahkan.', 'success')
    await fetchData() // Refresh data
  } catch (error) {
    console.error('Error saat menyimpan diskon:', error)
    
    // Tampilkan notifikasi error
    showSnackbar(
      error.response?.data?.message || 'Gagal menambahkan discount.', 
      'error'
    )
  }
}

const handleEdit = (item) => {
  alert(`Edit: ${item.nama}`)
  console.log('Data asli:', item.rawData)
}

const handleDelete = async () => {
  if (selected.value.length === 0) return
  showModal.value = false
  deleting.value = true

  try {
    // Hapus setiap item yang dipilih
    const deletePromises = selected.value.map(id => 
      fetch(`${baseUrl}/${id}`, {
        method: 'DELETE'
      })
    )
    
    const results = await Promise.all(deletePromises)
    
    // Cek apakah ada yang gagal
    const failedCount = results.filter(r => !r.ok).length
    
    if (failedCount === 0) {
      showSnackbar(`${selected.value.length} diskon berhasil dihapus`, 'success')
      selected.value = []
      await fetchData() // Refresh data
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
        <v-card-title class="d-flex justify-space-between align-center">
            <!-- KIRI: Judul + Total -->
            <div class="d-flex flex-column">
                <span class="text-h6">Daftar Diskon</span>
                <span class="text-body-2 text-grey">
                Total Diskon: {{ items.length }}
                </span>
            </div>

            <!-- KANAN: Tombol -->
            <div>
                <!-- Tombol normal ketika tidak ada yang dipilih -->
                <div v-if="selected.length === 0">
                 <DiskonModal ref="diskonModalRef" :existing-discounts="discounts" @save="handleSaveDiskon"/>
            </div>

                <!-- Tombol hapus & batalkan ketika ada yang dipilih -->
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
          :items="items"
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
              <p class="mt-2">Tidak ada data</p>
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
</style>