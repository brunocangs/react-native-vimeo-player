import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform
} from "react-native";

let Immersive = Platform.select({
  android: require('react-native-immersive').Immersive,
  ios: {
    off(){},
    setImmersive(){}
  }
})

const WebView = Platform.select({
  android: require("react-native-android-fullscreen-webview-video"),
  ios: require("react-native-webview").WebView
});

export default class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: props.url
    };
  }
  handleMessage = ({ nativeEvent: { data: dataString } }) => {
    const data = JSON.parse(dataString);
    if (!data.event) {
      console.log(data);
    }
    const events = [
      "bufferend",
      "bufferstart",
      "ended",
      "error",
      "loaded",
      "pause",
      "play",
      "playbackratechange",
      "progress",
      "seeked",
      "timeupdate",
      "volumechange",
      "fullscreen"
    ];
    if (data.event === "fullscreen" && Platform.OS === 'android') {
      Immersive.setImmersive(data.value);
    }
    events.forEach(event => {
      if (event === data.event && this.props[`on${event}`]) {
        this.props[`on${event}`](data);
      }
    });
  };
  shouldComponentUpdate(nextProps) {
    if (this.props.url !== nextProps.url) {
      this.webview.postMessage(nextProps.url.match(/\/(\d*)$/)[1], "*");
      this.state.url = nextProps.url;
      return false;
    }
    return true;
  }
  componentDidMount() {
    if (Platform.OS === 'android') {
      Immersive.off();
    }
  }
  componentWillUnmount() {
    if (Platform.OS === 'android') {
      Immersive.off();
    }
  }
  render() {
    const { url } = this.state;
    let videoId;
    if (~url.indexOf("vimeo")) {
      videoId = url.match(/\/(\d*)$/);
      videoId = (videoId || [])[1];
      return (
        <View style={styles.wrapper}>
          <WebView
            ref={ref => {
              this.webview = ref;
            }}
            source={{ html: makeHtml(videoId, Dimensions.get("window").width) }}
            originWhitelist={["*"]}
            style={styles.webview}
            mediaPlaybackRequiresUserAction={false}
            useWebKit
            onMessage={this.handleMessage}
          />
        </View>
      );
    }
    return null;
  }
}

const makeHtml = (videoId, deviceWidth) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box
    } 
  </style>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="ie=edge"/>
    </head>
    <body>
    <div style="padding:56.25% 0 0 0;position:relative;">
        <iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&portrait=0&fullscreen=true" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen="true"></iframe>
    </div>
    <script src="https://player.vimeo.com/api/player.js"></script>
    <script>
    const post = function (data) { window.postMessage(JSON.stringify(data))}
    var iframe = document.querySelector('iframe');
    var fullscreen = false;
    var player = new Vimeo.Player(iframe);
    var events = ['bufferend', 'bufferstart', 'ended', 'error', 'loaded', 'pause', 'play', 'playbackratechange', 'progress', 'seeked', 'timeupdate', 'volumechange']
    events.forEach(function(event) {
      player.on(event, (arguments) => {
        post({
          event,
          ...arguments
        })
      })
    })
    document.addEventListener('message', function(data) {
      post(data.data);
      player.loadVideo(data.data)
      .then(() => {
        player.play();
        post({success: true})
      })
      .catch(post);
    });
    window.onresize = function (event) {
      var width = document.documentElement.scrollWidth;
      post({event: 'fullscreen', value: (width != ${deviceWidth}), ...event})
    }
  </script>
    </body>
</html>`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "red"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  wrapper: {
    aspectRatio: 16 / 9,
    overflow: "hidden",
    width: "100%"
  },
  webview: {
    flex: 0,
    width: "100%",
    height: "100%"
  }
});
