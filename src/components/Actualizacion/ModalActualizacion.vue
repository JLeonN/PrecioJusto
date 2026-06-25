<template>
  <q-dialog v-model="modalVisible" persistent>
    <q-card class="modal-actualizacion">
      <q-card-section class="encabezado-actualizacion row items-center q-gutter-sm">
        <q-icon name="system_update" color="primary" size="26px" />
        <div class="titulo-actualizacion">Nueva actualización disponible</div>
      </q-card-section>
      <q-card-section class="contenido-actualizacion">
        <div class="versiones-actualizacion">
          <span>Tu versión: {{ versionInstalada || 'actual' }}</span>
          <span>Nueva versión: {{ versionDisponible || 'nueva' }}</span>
        </div>
        <p class="aviso-play-store">Play Store puede demorar en mostrar la nueva versión.</p>
        <!-- Las notas llegan desde version.json agrupadas por idioma, apartado y novedades. -->
        <section v-if="cambios.length > 0" class="novedades-actualizacion">
          <h2>Novedades de esta versión</h2>
          <div v-for="(grupo, indiceGrupo) in cambios" :key="indiceGrupo">
            <h3 v-if="grupo.apartado">{{ grupo.apartado }}</h3>
            <ul>
              <li v-for="(novedad, indiceNovedad) in grupo.novedades" :key="indiceNovedad">
                {{ novedad }}
              </li>
            </ul>
          </div>
        </section>
      </q-card-section>
      <q-card-actions align="right" class="acciones-actualizacion">
        <q-btn flat no-caps label="Más tarde" @click="emit('cerrar')" />
        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Ir a Play Store"
          @click="emit('actualizar')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  versionInstalada: {
    type: String,
    default: '',
  },
  versionDisponible: {
    type: String,
    default: '',
  },
  cambios: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['cerrar', 'actualizar'])

const modalVisible = computed({
  get: () => props.visible,
  set: (visible) => {
    if (!visible) {
      emit('cerrar')
    }
  },
})
</script>

<style scoped>
.modal-actualizacion {
  display: flex;
  flex-direction: column;
  width: min(92vw, 460px);
  max-height: min(76dvh, calc(100vh - var(--safe-area-top) - var(--safe-area-bottom) - 64px));
  color: var(--texto-primario);
  background: var(--fondo-dialogo);
  border: 1px solid var(--borde-color);
  border-radius: var(--borde-radio);
  box-shadow: var(--sombra-fuerte);
  overflow: hidden;
}
.encabezado-actualizacion {
  flex: 0 0 auto;
  padding: 18px 20px;
  border-bottom: 1px solid var(--borde-color);
}
.titulo-actualizacion {
  min-width: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.2;
}
.contenido-actualizacion {
  min-height: 0;
  padding: 16px 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.versiones-actualizacion {
  display: grid;
  gap: 4px;
  color: var(--texto-secundario);
  font-size: 0.95rem;
}
.aviso-play-store {
  padding: 10px 12px;
  margin: 14px 0;
  color: var(--texto-primario);
  background: color-mix(in srgb, var(--color-info) 10%, transparent);
  border-left: 4px solid var(--color-info);
  border-radius: 6px;
}
.novedades-actualizacion h2 {
  margin: 0 0 8px;
  font-size: 1.05rem;
}
.novedades-actualizacion h3 {
  margin: 10px 0 4px;
  color: var(--texto-secundario);
  font-size: 0.98rem;
}
.novedades-actualizacion ul {
  margin: 4px 0 0;
  padding-left: 22px;
}
.novedades-actualizacion li {
  margin-bottom: 5px;
}
.acciones-actualizacion {
  flex: 0 0 auto;
  padding: 10px 12px;
  border-top: 1px solid var(--borde-color);
}
@media (max-width: 380px) {
  .encabezado-actualizacion {
    padding: 14px 16px;
  }
  .contenido-actualizacion {
    padding: 12px 16px;
  }
  .acciones-actualizacion {
    justify-content: space-between;
  }
  .acciones-actualizacion .q-btn {
    padding: 4px 8px;
    font-size: 0.78rem;
  }
}
</style>
