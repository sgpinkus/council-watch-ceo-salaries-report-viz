<script lang='ts'>
import L from 'leaflet';
import type { Map } from 'leaflet';
import { defineComponent } from 'vue';
import { LMap, LTileLayer } from 'vue-leaflet-ng';
import FeaturesVic from '@/assets/features_vic.json';
import FeatureProps from '@/assets/feature_props.json';
import CouncilWatch from '@/assets/average-employee-costs_2023.json';
import type { Feature } from 'geojson';

  // {
  //   "Local Council": "West Wimmera",
  //   "Total FTE": "113",
  //   "Total Employment Costs": "10792000",
  //   "Average Salary": "10792001",
  //   "Profit": "10792002",
  //   "Staff per 1000 population": "28.69",
  //   "Population 2022": "3938",
  //   "Population 2021": "3977",
  //   "Cohort and Category": "Wimmera Sth Mallee",
  //   "CEO Remuneration 2021-2022": "$220-230k",
  //   "Type": "Category 1 Councils with 5 or 6 Councillors"
  // },

function areaPopup(id: number) {
  const props = FeatureProps.find((v) => v._id === id);
  if(!props) return 'Unknown';
  let watch: Record<string, string | number | undefined> | undefined = CouncilWatch.find((v) => (props && v['Local Council'] === props['local_council_name']));
  if(!watch) return 'Unknown';
  watch = { ...watch, Area: props.st_area_shape_ };
  const skip = ['Local Council'];
  if(!watch) return 'Unknown';
  let _html = '';
  for(const [k, v] of Object.entries(watch).filter(([k, v]) => !skip.includes(k))) {
    _html += `<dt>${k}</dt><dd>${v || 'Unknown'}</dd><br>`;
  }
  return `
  <h3>${watch['Local Council']}</h3>
  <dl>${_html}</dl>`;
}

export default defineComponent({
  components: {
    LMap,
    LTileLayer,
},
  emits: [], // TODO: https://leafletjs.com/reference.html#map-event
  data(): Record<any, any> {
    return {
      map: undefined,
      mapOptions: {
        zoom: 7,
        center: { 'lat': -37.8136276, 'lng': 144.9630576 },
      },
      tileLayer: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      },
      initBBox: [
        { lat: -33.9251, lng: 140.9106 },
        { lat: -39.1982, lng: 150.0952 },
      ],
      mapStyle: {},
      navDrawerProps: {
        permanent: true,
        app: true,
        rail: false,
        order: 2,
      }
    };
  },
  computed: {},
  methods: {
    mapReady(map: Map) {
      console.log('Map ready');
      this.map = map;
      FeaturesVic.map(f => {
          L.geoJSON<Feature[]>(f as any, {
          coordsToLatLng: (x: any) => L.Projection.SphericalMercator.unproject(L.point(x)),
          pointToLayer: (_, latlng) => L.circle(latlng),
          style: { // https://leafletjs.com/reference.html#path-option
            color: '#FF0000',
            weight: 1,
          }
        })
        .bindPopup(areaPopup(f._id))
        .addTo(map);
      });
      // @ts-ignore
      map.fitBounds(L.latLngBounds(...this.initBBox));
    },
    mapResize() {
      console.log(this.map?.getBounds(), this.map?.getZoom());
    },
    mapClick(e: any) {
      console.log(e?.latlng);
    }
  },
  mounted() {
    console.log('App Mounted');
  }
});
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-bind='navDrawerProps'
    >
      <v-list>
        <v-list-item
          title='Add Random Marker'
          prepend-icon='mdi-map-marker-plus'
        >
        </v-list-item>
        <v-list-item
          title='Remove Random Marker'
          prepend-icon='mdi-map-marker-minus'
        >
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main app style="height: 100vh">
      <v-container style="height: 100vh; margin: 0; padding: 0;">
        <LMap
          style="height: 100vh"
          :='mapOptions'
          @ready="mapReady"
          @resize="mapResize"
          @zoomend="mapResize"
          @moveend="mapResize"
          @click="mapClick"
        >
          <LTileLayer :='tileLayer'></LTileLayer>
        </LMap>
      </v-container>
    </v-main>
  </v-app>
</template>

<style global lang="scss">
  dt {
    display: inline-block;
    font-weight: bolder;
    &:after {
      content: ':\0000a0';
    }
  }
  dd {
    display: inline-block;
  }
</style>
