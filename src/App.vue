<script lang='ts'>
import L from 'leaflet';
import type { Map } from 'leaflet';
import { defineComponent } from 'vue';
import { LMap, LTileLayer } from 'vue-leaflet-ng';
import FeaturesVic from '@/assets/features_vic.json';
import FeatureProps from '@/assets/feature_props.json';
import type { Feature } from 'geojson';


function areaPopup(id: number) {
  const props = FeatureProps.find((v) => v._id === id);
  if(!props) return 'Unknown';
  return `
  <h3>${props.LGA_CODE_2019}</h3>
  <dl class='popup-details'>
    <dt>Feature ID</dt><dd>${id || 'Unknown'}</dd>
    <dt>State</dt><dd>${props.STATE_CODE_2016 || 'Unknown'}</dd>
  </dl>`;
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
