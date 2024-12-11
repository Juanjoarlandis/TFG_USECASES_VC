<template>
  <div
    class="flex flex-1 flex-col justify-center px-4 py-6 sm:px-6 lg:flex-none lg:px-20 xl:px-24 lg:bg-white lg:bg-opacity-50 sm:h-full sm:p-6"
  >
    <div class="sm:h-full w-full">
      <!-- Barra superior con título, búsqueda y acciones -->
      <div
        v-if="credentials && credentials.length > 0"
        class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4"
      >
        <div class="flex flex-col w-full sm:w-auto">
          <h1 class="text-3xl font-bold text-black">Credentials</h1>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search credentials..."
            class="mt-2 w-full sm:w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div
          class="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto"
        >
          <div class="flex gap-2">
            <NuxtLink :to="`/wallet/${walletId}/scan`">
              <button
                class="rounded-full px-6 py-1 text-white bg-[#01337D] shadow-lg hover:bg-[#002159] focus-visible:outline-none"
              >
                Present
              </button>
            </NuxtLink>
            <NuxtLink :to="`/wallet/${walletId}/scan`">
              <button
                class="rounded-full px-6 py-1 text-white bg-[#01337D] shadow-lg hover:bg-[#002159] focus-visible:outline-none"
              >
                Receive
              </button>
            </NuxtLink>
          </div>
          <button
            @click="toggleAllCategories"
            class="text-sm text-blue-600 underline hover:text-blue-800 self-start sm:self-center"
          >
            {{ allExpanded ? "Collapse All" : "Expand All" }}
          </button>
        </div>
      </div>

      <!-- Contenido principal -->
      <div v-if="credentials && filteredCredentials.length > 0">
        <div
          v-for="(creds, category) in groupedFilteredCredentials"
          :key="category"
          class="mb-8"
        >
          <!-- Header de la categoría -->
          <div
            class="flex items-center justify-between w-full bg-gradient-to-r from-gray-300 to-gray-400 rounded px-4 py-3 cursor-pointer hover:from-gray-400 hover:to-gray-500 transition-colors"
            @click="toggleCategory(category)"
          >
            <div class="flex items-center gap-2">
              <!-- Icono placeholder -->
              <svg
                class="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span class="text-xl sm:text-2xl font-bold text-black">
                {{ category }} ({{ creds.length }})
              </span>
            </div>
            <svg
              :class="{ 'transform rotate-180': expandedCategories[category] }"
              class="h-5 w-5 text-black transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          <!-- Contenido colapsable con transición -->
          <transition name="fade">
            <div v-show="expandedCategories[category]" class="mt-4">
              <div
                class="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-4 sm:gap-y-6"
              >
                <div
                  v-for="(credential, index) in creds"
                  :key="credential.id"
                  :style="{ backgroundColor: getColorForCredential(index) }"
                  class="relative col-span-1 divide-y divide-gray-200 rounded-2xl shadow transform hover:scale-[1.02] cursor-pointer duration-200 p-4"
                >
                  <NuxtLink
                    :to="
                      `/wallet/${walletId}/credentials/` +
                      encodeURIComponent(credential.id)
                    "
                    class="block w-full h-full"
                  >
                    <VerifiableCredentialCard :credential="credential" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <LoadingIndicator v-else-if="pending">
        Loading credentials...
      </LoadingIndicator>

      <div v-else class="h-full flex flex-col items-center justify-center">
        <p class="mt-2 text-md text-black">
          You don’t have any credentials yet!
        </p>
        <NuxtLink :to="`/wallet/${walletId}/scan`">
          <button
            class="mt-8 px-4 py-2 text-white bg-[#01337D] rounded-lg shadow-lg hover:bg-[#002159] focus-visible:outline-none"
          >
            Receive Credential
          </button>
        </NuxtLink>
      </div>
    </div>

    <!-- Botón flotante para modo móvil -->
    <div
      v-if="credentials && credentials.length > 0"
      class="fixed bottom-20 right-5 sm:hidden"
    >
      <NuxtLink :to="`/wallet/${walletId}/scan`">
        <button
          class="flex items-center justify-center h-14 w-14 rounded-full bg-black text-white shadow-lg hover:bg-blue-600 focus-visible:outline-none"
        >
          <img :src="scannerSVG" alt="Scan QR code" class="h-6 w-6" />
        </button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import VerifiableCredentialCard from "@waltid-web-wallet/components/credentials/VerifiableCredentialCard.vue";
import scannerSVG from "~/public/svg/scanner.svg";
import LoadingIndicator from "@waltid-web-wallet/components/loading/LoadingIndicator.vue";

const route = useRoute();
const walletId = route.params.wallet;

const {
  data: credentials,
  pending,
  refresh,
  error,
} = await useLazyFetch(
  `/wallet-api/wallet/${walletId}/credentials?showDeleted=false&showPending=false`
);
refreshNuxtData();

const expandedCategories = ref({});
const searchQuery = ref("");
const allExpanded = ref(false);

function toggleCategory(category) {
  expandedCategories.value[category] = !expandedCategories.value[category];
}

function toggleAllCategories() {
  const expand = !allExpanded.value;
  allExpanded.value = expand;
  Object.keys(groupedCredentials.value).forEach((cat) => {
    expandedCategories.value[cat] = expand;
  });
}

const colors = [
  "#F1F8E9", // Verde claro
  "#E3F2FD", // Azul claro
  "#FFF3E0", // Naranja claro
  "#FCE4EC", // Rosa claro
  "#EDE7F6", // Lila claro
  "#E0F7FA", // Cian claro
];

function getColorForCredential(index) {
  return colors[index % colors.length];
}

const groupedCredentials = computed(() => {
  if (!credentials.value) return {};
  return credentials.value.reduce((acc, credential) => {
    const category = credential.parsedDocument?.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(credential);
    return acc;
  }, {});
});

const filteredCredentials = computed(() => {
  if (!credentials.value) return [];
  const q = searchQuery.value.toLowerCase();
  return credentials.value.filter((cred) => {
    const name = cred.parsedDocument?.name?.toLowerCase() || "";
    const issuerName = cred.parsedDocument?.issuer?.name?.toLowerCase() || "";
    return name.includes(q) || issuerName.includes(q);
  });
});

const groupedFilteredCredentials = computed(() => {
  return filteredCredentials.value.reduce((acc, credential) => {
    const category = credential.parsedDocument?.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(credential);
    return acc;
  }, {});
});

definePageMeta({
  title: "Wallet dashboard - walt.id",
  layout: window.innerWidth > 650 ? "desktop" : "mobile",
});
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Transición para el fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
