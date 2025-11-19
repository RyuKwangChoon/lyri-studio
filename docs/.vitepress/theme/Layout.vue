<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <Footer />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import Footer from './components/Footer.vue'
</script>

<style>
/* 필요 없음 — 기본 레이아웃 유지됨 */
</style>
