/* eslint-disable */
/* global URL */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator} from '@deck.gl/core';
import {I3S3DLayer} from './i3s-3d-layer';
import {StatsWidget} from '@probe.gl/stats-widget';
import {lumaStats} from '@luma.gl/core';

import {centerMap, cesiumRender, cesiumUnload} from './cesium';

//SanFrancisco_Bldgs
//const TEST_DATA_URL = 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';
//const TEST_DATA_URL = 'https://tiles.arcgis.com/tiles/1ixiXpBUILnCHB94/arcgis/rest/services/Brampton_Scene_Service/SceneServer/layers/0';
const TEST_DATA_URL = 'https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/STM____FR_Lyon__Textured_buildings/SceneServer/layers/0?f=pjson';
//Textured&Untextured

//NY IntegreatedMesh
//const TEST_DATA_URL = 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/New_York_Mesh_NearMap/SceneServer/layers/0';
//philadelphia pictometery
//const TEST_DATA_URL = 'https://scenesampleserverdev.arcgis.com/arcgis/rest/services/Hosted/Buildings_Philadelphia/SceneServer/layers/0';
//'https://urldefense.proofpoint.com/v2/url?u=https-3A__tiles.arcgis.com_tiles_z2tnIkrLQ2BRzr6P_arcgis_rest_services_philadelphia-5FBldgs-5Ftext-5Funtex_SceneServer_layers_0&d=DwIGAg&c=r2dcLCtU9q6n0vrtnDw9vg&r=uUft2jfAcssCZvs7TNFSSg&m=_cRfm773wKwaQfY-gwJnmnFhdfAc2w6eiJ0365x2msY&s=JSwo9eTTG3Pxwevj25groHWmKSPS5IJAB6lzSIoo_ns&e= ';
// Texturedonly
//New_York_Buildings
//const TEST_DATA_URL = 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/New_York_Mesh_NearMap/SceneServer/layers/0';

//Ignite_demo_v17
//const TEST_DATA_URL =
//'https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Ignite_demo_v17/SceneServer/layers/0';

//melbourne_acrossTiles_update8
//const TEST_DATA_URL =
//'https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/melbourne_acrossTiles_update8/SceneServer/layers/0';

//
//const TEST_DATA_URL =
//'https://tiles.arcgis.com/tiles/u0sSNqDXr7puKJrF/arcgis/rest/services/Frankfurt2017_v17/SceneServer/layers/0';

//philadelphia_Bldgs_text
//const TEST_DATA_URL = 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/philadelphia_Bldgs_text_untex/SceneServer/layers/0';

// Set your mapbox token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoidGFtYjR1IiwiYSI6ImNrMmY4Y2RsbzBob3czZW1vZTVzcmU3MzQifQ.Y580v4-C_xIlt2Ajhlc8kA'; //process.env.MapboxAccessToken; // eslint-disable-line

const TRANSITION_DURAITON = 4000;

//Brampton_Scene_Service

const INITIAL_VIEW_STATE = {
  longitude: 4.770754758731864,
  latitude: 45.7083806673883,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
}

//SF

const INITIAL_VIEW_STATE2 = {
  longitude: -122.43751306035713,
  latitude: 37.78249440803938,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
}

/*const INITIAL_VIEW_STATE = {
  longitude:-74.02738829429421,
  latitude: 40.81025995903401,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};*/

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this._tilesetStatsWidget = null;
    this.state = {
      renderCesium: false,
      layerMap: {},
      layers: [],
      viewState: INITIAL_VIEW_STATE
    };
  }

  componentDidMount() {
    const parsedUrl = new URL(window.location.href);
    const renderCesium = parsedUrl.searchParams.get('cesium');
    this.setState({renderCesium});

    this._memWidget = new StatsWidget(lumaStats.get('Memory Usage'), {
      framesPerUpdate: 1,
      formatters: {
        'GPU Memory': 'memory',
        'Buffer Memory': 'memory',
        'Renderbuffer Memory': 'memory',
        'Texture Memory': 'memory'
      },
      container: this._statsWidgetContainer
    });
    this._tilesetStatsWidget = new StatsWidget(null, {
      container: this._statsWidgetContainer
    });
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();
    this._tilesetStatsWidget.update();
  }

  _onTilesetLoad(tileset) {
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter;

    const viewState = {
      ...this.state.viewState,
      zoom,
      longitude,
      latitude
    };

    this.setState({
      tileset,
      viewState: {
        ...viewState,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      }
    });
    //comment out below line to show full service url
    if (tileset.stats.id.split('services/')[1].split('/SceneServer')[0].length > 0)
      tileset.stats.id = tileset.stats.id.split('services/')[1].split('/SceneServer')[0];
    this._tilesetStatsWidget.setStats(tileset.stats);
    // render with cesium
    if (this.state.renderCesium) {
      centerMap(viewState);
    }
  }

  _onTileLoad(tile) {
    if (this.state.renderCesium) {
      const {viewState} = this.state;
      cesiumRender(viewState, tile);
    }
  }

  _onTileUnload(tile) {
    if (this.state.renderCesium) {
      cesiumUnload(tile);
    }
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});

    if (this.state.renderCesium) {
      centerMap(viewState);
    }
  }

  _renderLayers() {
    return [
      new I3S3DLayer({
        data: TEST_DATA_URL,
        onTilesetLoad: this._onTilesetLoad.bind(this),
        onTileLoad: this._onTileLoad.bind(this),
        onTileUnload: this._onTileUnload.bind(this)
      })
    ];
  }

  _renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return (
      <div
        style={{
          position: 'absolute',
          padding: 12,
          zIndex: '10000',
          maxWidth: 300,
          background: '#000',
          color: '#fff'
        }}
        ref={_ => (this._statsWidgetContainer = _)}
      />
    );
  }

  render() {
    const layers = this._renderLayers();

    return (
      <div>
        {this._renderStats()}
        <DeckGL
          ref={_ => (this._deckRef = _)}
          layers={layers}
          initialViewState={INITIAL_VIEW_STATE}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
          onAfterRender={() => this._updateStatWidgets()}
        >
          <StaticMap
            mapStyle={'mapbox://styles/mapbox/dark-v9'}
            mapboxApiAccessToken={MAPBOX_TOKEN}
            preventStyleDiffing
          />
        </DeckGL>
      </div>
    );
  }
}

const deckViewer = document.getElementById('deck-viewer');
render(<App />, deckViewer);
