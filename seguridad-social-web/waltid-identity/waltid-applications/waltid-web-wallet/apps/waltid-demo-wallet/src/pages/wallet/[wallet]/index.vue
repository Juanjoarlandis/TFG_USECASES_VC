<template>
  <div>
    <WalletPageHeader />
    <CenterMain>
      <h2 class="text-lg font-semibold">Select wallet</h2>
      <ul v-if="wallets.length">
        <li
          v-for="w in wallets"
          :key="w.id"
          class="flex items-center justify-between gap-x-6 py-5"
        >
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">
              {{ w.name }}
            </p>
          </div>
          <div class="flex-none">
            <button
              @click="goTo(w.id)"
              class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              View wallet
            </button>
          </div>
        </li>
      </ul>
      <LoadingIndicator v-else />
    </CenterMain>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "#app";
import WalletPageHeader from "@waltid-web-wallet/components/WalletPageHeader.vue";
import CenterMain from "@waltid-web-wallet/components/CenterMain.vue";
import LoadingIndicator from "@waltid-web-wallet/components/loading/LoadingIndicator.vue";
import {
  listWallets,
  setWallet,
} from "@waltid-web-wallet/composables/accountWallet.ts";

const router = useRouter();
const wallets = ref<{ id: string; name: string }[]>([]);

onMounted(async () => {
  const res = await listWallets();
  wallets.value = res?.value?.wallets || [];
  // Si solo hay una wallet, redirige directamente
  if (wallets.value.length === 1) {
    const id = wallets.value[0].id;
    setWallet(id);
    router.push(`/wallet/${id}`);
  }
});

function goTo(id: string) {
  setWallet(id);
  router.push(`/wallet/${id}`);
}
</script>
