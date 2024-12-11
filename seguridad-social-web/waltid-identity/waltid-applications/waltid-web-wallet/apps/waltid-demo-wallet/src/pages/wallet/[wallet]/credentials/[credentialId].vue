<template>
  <CenterMain>
    <div v-if="pending" class="flex justify-center items-center h-screen">
      <LoadingIndicator>Loading credential...</LoadingIndicator>
    </div>
    <div v-else>
      <!-- Hero Section -->
      <div
        class="relative bg-gradient-to-r from-blue-50 to-blue-100 rounded-b-xl p-4 sm:p-6 mb-8 shadow"
      >
        <div class="absolute top-4 left-4 sm:top-6 sm:left-6 flex gap-2">
          <div
            class="cursor-pointer bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-black"
            @click="navigateTo({ path: `/wallet/${walletId}` })"
            title="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        </div>
        <div class="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div
            class="cursor-pointer bg-white hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center text-red-500"
            @click="deleteCredential"
            title="Delete Credential"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
              />
              <path
                d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z"
              />
            </svg>
          </div>
        </div>

        <div class="text-center mt-10 sm:mt-12">
          <div class="flex justify-center mb-4">
            <svg
              class="h-10 w-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 11c1.956 0 3.538-1.582 3.538-3.538C15.538 5.582 13.956 4 12 4s-3.538 1.582-3.538 3.538C8.462 9.418 10.044 11 12 11zM12 13c-2.486 0-7 1.243-7 3.732V19h14v-2.268C19 14.243 14.486 13 12 13z"
              />
            </svg>
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-700">
            {{ credential?.parsedDocument?.name || "Credential Details" }}
          </h2>
          <p class="text-md text-gray-600 mt-1">
            {{ issuerName || "Unknown Issuer" }}
          </p>
        </div>
      </div>

      <!-- Main content -->
      <div class="px-4 py-6 max-w-5xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Subject Info Card -->
          <div
            v-if="credentialManifest || credential?.format === 'mso_mdoc'"
            class="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3
              class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"
            >
              <svg
                class="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5.121 17.804A1 1 0 006 19h12a1 1 0 00.879-1.476l-6-10a1 1 0 00-1.758 0l-6 10z"
                />
              </svg>
              Subject Info
            </h3>
            <div v-if="credentialManifest">
              <div
                v-for="(value, key, index) in credentialManifest.claims"
                :key="key"
                class="mb-3"
              >
                <div class="text-sm text-gray-500 font-medium">{{ key }}</div>
                <div class="text-gray-700 font-semibold">{{ value }}</div>
                <hr
                  v-if="
                    index !== Object.keys(credentialManifest.claims).length - 1
                  "
                  class="my-2 border-gray-200"
                />
              </div>
            </div>
            <div
              v-if="credential?.format === 'mso_mdoc' && jwtJson?.issuerSigned"
            >
              <div
                v-for="(elem, index) in jwtJson?.issuerSigned?.nameSpaces[
                  Object.keys(jwtJson?.issuerSigned?.nameSpaces)[0]
                ]"
                :key="index"
                class="mb-3"
              >
                <div class="text-sm text-gray-500 font-medium">
                  {{ elem.elementIdentifier }}
                </div>
                <div class="text-gray-700 font-semibold">
                  {{ elem.elementValue }}
                </div>
                <hr
                  v-if="
                    index !==
                    jwtJson?.issuerSigned?.nameSpaces[
                      Object.keys(jwtJson?.issuerSigned?.nameSpaces)[0]
                    ].length -
                      1
                  "
                  class="my-2 border-gray-200"
                />
              </div>
            </div>
          </div>

          <!-- Issuer Info Card -->
          <div
            class="bg-white rounded-xl p-6 shadow-sm"
            v-if="issuerName || issuerDid || issuanceDate || expirationDate"
          >
            <h3
              class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"
            >
              <svg
                class="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.75 17l-2.75-2.75a1 1 0 010-1.414L9.75 10.25m4.5 6.75l2.75-2.75a1 1 0 000-1.414L14.25 10.25"
                />
              </svg>
              Issuer & Dates
            </h3>
            <div v-if="issuerName" class="mb-3">
              <div class="text-sm text-gray-500 font-medium">Name</div>
              <div class="text-gray-700 font-semibold">{{ issuerName }}</div>
            </div>
            <div v-if="issuerDid" class="mb-3">
              <div class="text-sm text-gray-500 font-medium">DID</div>
              <div class="text-gray-700 font-semibold break-all">
                {{ issuerDid }}
              </div>
            </div>
            <div class="mb-3">
              <div class="text-sm text-gray-500 font-medium">Issuance</div>
              <div class="text-gray-700 font-semibold">
                {{
                  issuanceDate
                    ? "Issued " + issuanceDate.replace(/-/g, ".")
                    : "No issuance date"
                }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500 font-medium">Validity</div>
              <div class="text-gray-700 font-semibold">
                <span v-if="expirationDate"
                  >Valid through {{ issuanceDate?.replace(/-/g, ".") }} -
                  {{ expirationDate.replace(/-/g, ".") }}</span
                >
                <span v-else>No expiration date</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Disclosures -->
        <div v-if="disclosures" class="bg-white rounded-xl p-6 shadow-sm mt-6">
          <h3
            class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"
          >
            <svg
              class="h-5 w-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8c-1.104 0-2 .896-2 2 0 .861.556 1.586 1.333 1.874C10.925 12.947 11 13.22 11 13.5c0 .28.075.553.333.626C11.444 14.414 11 15.139 11 16c0 1.104.896 2 2 2s2-.896 2-2c0-.861-.556-1.586-1.333-1.874C12.925 13.053 13 12.78 13 12.5c0-.28-.075-.553-.333-.626C12.556 11.586 13 10.861 13 10c0-1.104-.896-2-2-2z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 5c-3.866 0-7 2.462-7 5.5S8.134 16 12 16s7-2.462 7-5.5S15.866 5 12 5z"
              />
            </svg>
            Selectively disclosable attributes
          </h3>
          <div
            v-for="disclosure in disclosures"
            :key="disclosure[1]"
            class="mb-3"
          >
            <div class="text-sm text-gray-500 font-medium">
              {{ disclosure[1] }}
            </div>
            <div class="text-gray-700 font-semibold break-all">
              {{ disclosure[2] }}
            </div>
          </div>
        </div>

        <!-- Actions at the bottom -->
        <div
          class="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4"
        >
          <div
            class="text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
            @click="showCredentialJson = !showCredentialJson"
          >
            <svg
              v-if="!showCredentialJson"
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12H3m0 0l3.75 3.75M3 12l3.75-3.75M21 5v14"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span
              >{{ showCredentialJson ? "Hide" : "Show" }} Credential JSON</span
            >
          </div>

          <div
            class="text-red-500 cursor-pointer hover:underline flex items-center gap-1"
            @click="deleteCredential"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 13h6m2 0a2 2 0 01-2 2H9a2 2 0 01-2-2m10-2a2 2 0 00-2-2H9a2 2 0 00-2 2"
              />
            </svg>
            <span>Delete Credential</span>
          </div>
        </div>

        <!-- JSON Display -->
        <transition name="fade">
          <div
            v-if="showCredentialJson"
            class="bg-gray-100 p-4 rounded-xl overflow-auto mt-4 text-sm"
          >
            <pre class="whitespace-pre-wrap break-words">{{ jwtJson }}</pre>
          </div>
        </transition>
      </div>
    </div>
  </CenterMain>
</template>

<script lang="ts" setup>
import VerifiableCredentialCard from "@waltid-web-wallet/components/credentials/VerifiableCredentialCard.vue";
import {
  useCredential,
  type WalletCredential,
} from "@waltid-web-wallet/composables/credential.ts";
import LoadingIndicator from "@waltid-web-wallet/components/loading/LoadingIndicator.vue";
import { useCurrentWallet } from "@waltid-web-wallet/composables/accountWallet.ts";
import CenterMain from "@waltid-web-wallet/components/CenterMain.vue";
import { JSONPath } from "jsonpath-plus";
import { ref } from "vue";

const route = useRoute();
const runtimeConfig = useRuntimeConfig();

const walletId = route.params.wallet as string;
const credentialId = route.params.credentialId as string;
const currentWallet = useCurrentWallet();

const showCredentialJson = ref(false);

const {
  data: credential,
  pending,
  refresh,
  error,
} = await useFetch<WalletCredential>(
  `/wallet-api/wallet/${currentWallet.value}/credentials/${encodeURIComponent(
    credentialId
  )}`
);

const {
  jwtJson,
  disclosures,
  issuerName,
  issuerDid,
  issuanceDate,
  expirationDate,
} = useCredential(credential);

const credentialManifest = computedAsync(async () => {
  if (jwtJson.value) {
    const { data } = await useFetch(
      `${runtimeConfig.public.credentialsRepositoryUrl}/api/manifest/${
        jwtJson.value?.type[jwtJson.value?.type.length - 1]
      }`,
      {
        transform: (data: { claims: { [key: string]: string } }) => {
          return {
            ...data,
            claims: Object.fromEntries(
              Object.entries(data?.claims).map(([key, value]) => {
                return [
                  key,
                  JSONPath({ path: value, json: jwtJson.value })[0] ??
                    disclosures.value?.find(
                      (disclosure) => disclosure[1] === value.split(".").pop()
                    )?.[2],
                ];
              })
            ),
          };
        },
      }
    );
    return data.value;
  }
  return null;
});

async function deleteCredential() {
  await $fetch(
    `/wallet-api/wallet/${currentWallet.value}/credentials/${encodeURIComponent(
      credentialId
    )}`,
    {
      method: "DELETE",
    }
  );
  await navigateTo({ path: `/wallet/${currentWallet.value}` });
}

useHead({ title: "View credential - walt.id" });
definePageMeta({
  layout: window.innerWidth > 650 ? "desktop-without-sidebar" : false,
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
