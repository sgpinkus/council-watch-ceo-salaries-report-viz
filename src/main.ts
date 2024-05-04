import 'vuetify/styles'; // Global CSS has to be imported
import { createApp } from 'vue';

import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import 'leaflet/dist/leaflet.css';
import './main.css';

import App from './App.vue';

const app = createApp(App);
const vuetify = createVuetify({
  components,
  directives,
});

app.use(vuetify);

app.mount('#app');

