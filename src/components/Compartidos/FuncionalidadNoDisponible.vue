<template>
  <q-card flat bordered class="funcionalidad-no-disponible">
    <q-card-section class="row items-center q-gutter-sm">
      <q-icon :name="icono" size="40px" color="grey-6" />
      <div class="col">
        <div class="text-subtitle1 text-weight-medium text-grey-8">
          {{ titulo }}
        </div>
        <div class="text-caption text-grey-6">
          {{ descripcion }}
        </div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-py-sm bg-blue-1">
      <div class="row items-center q-gutter-xs">
        <q-icon name="phone_android" size="18px" color="primary" />
        <span class="text-caption text-primary"> Disponible en la app Android </span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  titulo: {
    type: String,
    default: 'Funcionalidad no disponible',
  },
  descripcion: {
    type: String,
    default: 'Esta función solo está disponible en la versión Android de la aplicación.',
  },
  icono: {
    type: String,
    default: 'block',
  },
})
</script>

<style scoped>
.funcionalidad-no-disponible {
  border-color: #e0e0e0;
  border-radius: 8px;
}
</style>
