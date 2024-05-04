<script lang='ts'>
import L from 'leaflet';
import type { Map } from 'leaflet';
import { defineComponent } from 'vue';
import { LMap, LTileLayer } from 'vue-leaflet-ng';
import FeaturesVic from '@/assets/features_vic.json';
import FeatureProps from '@/assets/feature_props_vic.json';
import colormap from 'colormap';

const CouncilWatchFields = {
  'Local Council': 'West Wimmera',
  'Total FTE': '113',
  'Total Employment Costs': '10792000',
  'Average Salary': '10792001',
  'Profit': '10792002',
  'Staff per 1000 population': '28.69',
  'Population 2022': '3938',
  'Population 2021': '3977',
  'Cohort and Category': 'Wimmera Sth Mallee',
  'CEO Remuneration 2021-2022': '225',
  'Type': 'Category 1 Councils with 5 or 6 Councillors',
  'Area': 'x',
};
const CouncilWatchHeatFields = {
  'Total FTE': '113',
  'Total Employment Costs': '10792000',
  'Average Salary': '10792001',
  'Profit': '10792002',
  'Staff per 1000 population': '28.69',
  'Population 2022': '3938',
  'Population 2021': '3977',
  'CEO Remuneration 2021-2022': '225',
  'Area': 'x',
};
// const CouncilWatchUnitsAndFormatters = {};
const _colorMap = colormap({
  colormap: 'jet',
  nshades: 20,
  format: 'hex',
});
// Used for hacked reactivity.
let _leafletFeatureUnbind: Record<number, any> = {};


function areaPopup(id: number) {
  const props = FeatureProps.find((v) => v._id === id);
  if(!props) return 'Unknown';
  // @ts-ignore
  props['Area'] = props.st_area_shape_;
  const skip = ['Local Council'];
  const include = Object.keys(CouncilWatchFields);
  let _html = '';
  for(const [k, v] of Object.entries(props).filter(([k, v]) => include.includes(k) && !skip.includes(k))) {
    _html += `<dt>${k}</dt><dd>${v || 'Unknown'}</dd><br>`;
  }
  return `
  <h3>${props['Local Council']}</h3>
  <dl>${_html}</dl>`;
}


function makeHeatMap(k: string, collection: any[], n = 20) {
  const present = collection.filter(v => v[k] !== undefined && v[k] !== null);
  // const absent = collection.filter(v => v[k] === undefined || v[k] === null);
  const sorted = present.toSorted((a: any, b: any) => a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0 );
  return sorted.map((v: any, k: any) => ({ _id: v._id, k, bucket: Math.floor(n*(k/present.length)) }));
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
      },
      councilWatchFields: Object.keys(CouncilWatchFields),
      councilWatchHeatFields: ['None', ...Object.keys(CouncilWatchHeatFields)],
      heatKey: 'CEO Remuneration 2021-2022',
      heatMaps: {},
      rail: false,
      featureProps: FeatureProps,
      filterText: 's',
      focusedFeature: undefined,
      about: false,
    };
  },
  computed: {
    heatMap() {
      return this.heatMaps[this.heatKey] || undefined;
    },
    searchResults() {
      return [undefined, ...FeatureProps.map(v => v['Local Council'])];
    }
  },
  watch: {
    heatKey: {
      handler(k) {
        if(!this.heatMaps[k] && k !== 'None') {
          this.heatMaps[k] = makeHeatMap(k, FeatureProps);
        }
        if(this.map) {
          this.bindFeatures();
        }
      },
      immediate: true,
    },
    focusedFeature(n, o) {
      if(o) _leafletFeatureUnbind[o._id].closePopup();
      if(n) _leafletFeatureUnbind[n._id].openPopup();
    }
  },
  methods: {
    mapReady(map: Map) {
      console.log('Map ready');
      this.map = map;
      this.bindFeatures();
      // @ts-ignore
      map.fitBounds(L.latLngBounds(...this.initBBox));
    },
    bindFeatures() {
      Object.values(_leafletFeatureUnbind).map(v => v.remove());
      _leafletFeatureUnbind = Object.fromEntries(FeaturesVic.map((f) => {
          return [f._id, L.geoJSON<any[]>(f as any, {
          coordsToLatLng: (x: any) => L.Projection.SphericalMercator.unproject(L.point(x)),
          pointToLayer: (_, latlng) => L.circle(latlng),
          style: { // https://leafletjs.com/reference.html#path-option
            color: '#000000',
            fillColor: this.getFeatureColor(f._id),
            fillOpacity: 0.5,
            weight: 1,
          }
        })
        .bindPopup(areaPopup(f._id))
        .addTo(this.map)];
      }));
    },
    getFeatureColor(id: number) {
      const uncolored = '#AAAAAA';
      if(this.heatMap) {
        const bucket = this.heatMap.find((v: any) => v._id === id)?.bucket;
        return bucket !== undefined ?_colorMap[bucket] : uncolored;
      }
      return uncolored;
    },
    clearAll() {
      this.focusedFeature = undefined;
    }
  },
  mounted() {
    console.log('App Mounted');
  }
});
</script>

<template>
  <v-app
    @keyup.escape='clearAll'
  >
    <v-dialog
      v-model='about'
    >
      <v-card class='pa-10'>
        <ul>
          <p>This is a map visualization of the <a href='https://www.councilwatch.com.au/general-5'>Council Salaries Report</a> (datafile <a href='https://onedrive.live.com/view.aspx?resid=CDB033654DCBC7C0!140382&cid=cdb033654dcbc7c0&authkey=!AEc182roe43hZcc&CT=1714822657200&OR=ItemsView'>HERE</a>).
        Refer to <a href='https://www.councilwatch.com.au'>Council Watch</a> website for attribution and notes on data collection methods.
        <br>
        Map layers: <a href='https://www.openstreetmap.org/'>openstreetmap.org</a>. Victorian geographic regions: <a href='https://geo.abs.gov.au/arcgis/rest/services/ASGS2019/LGA/OGCFeatureServer'>geo.abs.gov.au</a>. Other software: See package.json
        </p>
        </ul>

      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-bind='navDrawerProps'
    >
      <v-list density='compact' style='padding: 0'>
        <v-list-subheader v-if='!rail'>Doc</v-list-subheader>
        <a href='#'><v-list-item @click='about = !about' prepend-icon='mdi-text-box' class='v-label'>About</v-list-item></a>
        <v-divider thickness='10'></v-divider>
        <v-list-subheader v-if='!rail'>Heat Map</v-list-subheader>
        <v-list-item  density='compact'>
          <v-radio-group
            v-model='heatKey'
            hide-details
            >
            <v-radio v-for="(v) in councilWatchHeatFields" :key=v
                :label="v"
                density='compact'
                hide-details
                :value='v'
            >
            </v-radio>
          </v-radio-group>
        </v-list-item>
        <v-divider thickness='10'></v-divider>
        <v-list-subheader v-if='!rail'>Show Council</v-list-subheader>
        <v-autocomplete
          v-model="focusedFeature"
          v-model:search="filterText"
          :items="featureProps"
          item-title="Local Council"
          item-value="Local Council"
          return-object
          no-filter
          style="max-height: 50vh;"
        ></v-autocomplete>
        <!-- <v-divider thickness='10'></v-divider> -->
      </v-list>
    </v-navigation-drawer>
    <v-main app style="height: 100vh">
      <v-container style="height: 100vh; margin: 0; padding: 0;">
        <LMap
          style="height: 100vh"
          :='mapOptions'
          @ready="mapReady"
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
