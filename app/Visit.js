import * as React from 'react';
import Constants from 'expo-constants';
import { StyleSheet, Dimensions } from 'react-native';
import { HStack, Box, Icon, Pressable, Text, NativeBaseProvider, Center } from 'native-base';
import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons"
import { BASE_URL } from "../component/Server";
import { WebView } from 'react-native-webview';
import moment from 'moment';
import * as Location from 'expo-location'
import 'moment/locale/id';
const deviceWidth = Dimensions.get("window").width;
import db from '../database';


export default class Visit extends React.Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      //token: '',
      divisi: null,
      user: null,
      url: null,
      selected: 2,
      mocked: false,
      lat: '',
      lon: '',
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.getLocationAsync();
    /* const { divisi } = this.props.route.params;
    const { user } = this.props.route.params;
    this.setState({
      divisi: divisi,
      user: user,
      url: BASE_URL + '/web/index.php?r=android/pengiriman&divisi=' + divisi + '&user=' + user + '&lat=' + this.state.lat + '&lon=' + this.state.lon
    }); */
  }

  UNSAFE_componentWillMount(){
    this.focusListener = this.props.navigation.addListener('focus', () => {
        this.getLocationAsync();
    });
  }

  getLocationAsync = async () => {
    const { divisi } = this.props.route.params;
    const { user } = this.props.route.params;
    await Location.hasServicesEnabledAsync()
    await Location.watchPositionAsync({ accuracy: Location.Accuracy.Highest, timeInterval: 1, }, ( async point => {
      const location = point.coords
      const { mocked } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest, timeInterval: 1, })

        this.setState({
          divisi: divisi,
          user: user,
          mocked,
          url: BASE_URL + '/web/index.php?r=android/visitsales&divisi=' + divisi + '&user=' + user + '&lat=' + location.latitude + '&lon=' + location.longitude
        });
    })).catch(err => {
      return
    })
  }
    
  componentWillUnmount(){
    this._isMounted = false;
    this.focusListener = this.props.navigation.removeListener('focus', () => {
    });
    console.log('leave screen pengiriman');
  }

  handleFoto = (newNavState) => {
    // newNavState looks something like this:
    // {
    //   url?: string;
    //   title?: string;
    //   loading?: boolean;
    //   canGoBack?: boolean;
    //   canGoForward?: boolean;
    // }
    const { url } = newNavState;
    if (!url) return;
    //console.log({ inhomeurl: url });
    if(newNavState){
      this.setState({
        url: url
      });
    }
    

    if (!url.includes(BASE_URL)) {
      this.setState({
        url: BASE_URL
      });
    }

    // redirect polilist
    if (url.includes('?r=android/ambilfoto')) {
      var regexp = /[?&]([^=#]+)=([^&#]*)/g,params = {},check;
      while (check = regexp.exec(url)) {
        params[check[1]] = check[2];
      }
      //console.log("params",params)
      console.log(params.pengiriman);
      this.props.navigation.navigate('Ambilfoto', { pengiriman: params.pengiriman, user: this.state.user });
      this._isMounted = false;
    }
  }
    
  render() {
    
    console.log({screen: 'on screen pengiriman', url: this.state.url});
    if (this.state.mocked == true) {
      return (
      <NativeBaseProvider>
      <Box p={0} m={0} w={deviceWidth/1} flex={1} bg='dark.100'>
        <Center>
        <Text color="white" fontSize={14}>Fake GPS not Allowed!</Text>
        </Center>
      </Box>
      </NativeBaseProvider>
      );
    }else{
      return (
        <NativeBaseProvider>
        <Box p={0} m={0} w={deviceWidth/1} flex={1} bg='dark.100'>
          <WebView
              startInLoadingState={true}
              style={styles.container}
              source={{ uri: this.state.url }}
              ref={(ref) => (this.webview = ref)}
              onNavigationStateChange={this.handleFoto}
          />
        </Box>
        </NativeBaseProvider>
      );
    }
    }
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      marginTop: 0
  },
});