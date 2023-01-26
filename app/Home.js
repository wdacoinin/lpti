import * as React from 'react';
import Constants from 'expo-constants';
import { StyleSheet, Alert, Dimensions } from 'react-native';
import { View, HStack, Box, Icon, Pressable, Input, Button, Text, Modal, NativeBaseProvider, Center } from 'native-base';
import { MaterialCommunityIcons, FontAwesome, Ionicons } from "@expo/vector-icons"
import { BASE_URL } from "../component/Server";
import * as WebBrowser from 'expo-web-browser';
//import * as Permissions from 'expo-permissions';
//import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import moment from 'moment';
import 'moment/locale/id';
const deviceWidth = Dimensions.get("window").width;
import db from '../database';



export default class Home extends React.Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      isConnected: null,
      contype: null,
      username: null,
      nama: null,
      id: '',
      divisi: null,
      message: null,
      isi: null,
      adevice: null,
      modalVisible: false,
      mac: '',
      device_type: '',
      devfp: '',
      selected: 1,
      date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      url: BASE_URL+ '/web/index.php?r=android',
      refreshing: false,
      description: null
    };
    
  }

  credential = () => {
    db.transaction(
      tx => {
        tx.executeSql('select id, username, nama, divisi from appusers', [], (_, { rows: { _array } }) => {
          //if(rows.lenght > 0){
            const { log } = this.props.route.params;
            if(log > 0){
                this.setState({
                  id: _array[0].id,
                  username: _array[0].username,
                  nama: _array[0].nama,
                  divisi: _array[0].divisi,
                  modalVisible: true,
                });
            }
            console.log({ usernameAtHomeScreen: this.state.username, urlAtHomeScreen: this.state.url })

          //}
        }, function(tx, err){
            console.log(err)
        });
      },
      null,
    );
  }

  version = () => {
    let ver = require('../app.json');
    var versi = ver.expo;
    var des = versi.description;
    return(
      <HStack style={{ backgroundColor: 'transparent' }} justifyContent='center' alignItems="center" safeAreaBottom shadow={6}><Text style={{color:'#777', fontSize:9}}>{des}</Text></HStack>
    );
  }

  get = async () => {
    if (this.state.id !== '') {

      const formData = new FormData();
      formData.append('normnik', this.state.divisi);
      const options = {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      };
      try {
        const url = BASE_URL + '/web/index.php?r=apiandroid/verify';
        const response = await fetch(url, options);
        const responseJson = await response.json();

        if (responseJson.hasil === 'success') {
          var pasien_detail = responseJson.pasien_detail;
          this.setState({
            id: pasien_detail.id,
            divisi: pasien_detail.no_rekam_medik,
            nama: pasien_detail.nama_pasien,
            message: responseJson.message
          });

        }

      }
      catch (error) {
        console.log(error);
        Alert.alert(
          'LPTI',
          'Error Koneksi',
          [
            {
              text: 'OK', onPress: () => {
                console.log('OK Pressed');
              }
            },
          ],
          { cancelable: false }
        );
      }
    }
  }

  componentDidMount() {
    
    this.credential();
    console.log('on home screen');
    this._isMounted = true;
  }

  UNSAFE_componentWillMount(){
    this.focusListener = this.props.navigation.addListener('focus', () => {
      this.setState({
        url: BASE_URL+ '/web/index.php?r=android',
      });
    });
  }

  componentWillUnmount(){
    this._isMounted = false;
    this.focusListener = this.props.navigation.removeListener('focus', () => {
    });
    console.log('leave home screen');
  }


  handleWebViewNavigationStateChange = (newNavState) => {
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

    if (!url.includes(BASE_URL)) {
      this.setState({
        url: BASE_URL+ '/web/index.php?r=android',
      });
    }

    //this.setState({url:url });
    // handle certain doctypes
    if (url.includes('.pdf')) {
      this.webview.stopLoading();
      // open a modal with the PDF viewer
    }

    // one way to handle a successful form submit is via query strings
    if (url.includes('?message=success')) {
      this.webview.stopLoading();
      // maybe close this view?
    }

    // one way to handle errors is via query string
    if (url.includes('?errors=true')) {
      this.webview.stopLoading();
    }

    // redirect somewhere else
    if (url.includes('google.com')) {
      const newURL = BASE_URL;
      const redirectTo = 'window.location = "' + newURL + '"';
      this.webview.injectJavaScript(redirectTo);
    }
    // redirect polilist
    /* if (url.includes('/web/index.php?r=apiandroid%2Fpolilist')) {
      const redirectTo = 'window.location = "' + BASE_URL + '/web/index.php?r=apiandroid/dokteronreserve&id=' + this.state.id + '"';
      this.webview.injectJavaScript(redirectTo); console.log({ redirectTo: redirectTo });
    } */
  }

  sign_Out = () => {
    this.props.navigation.navigate('Logout');
  }

  menubar = () => {
    console.log({user: this.state.id});
    if(this.state.username != null){
      return(

        <HStack style={{ backgroundColor: '#172A7B' }} alignItems="center" safeAreaBottom shadow={6}>
          <Pressable
            opacity={this.state.selected === 1 ? 1 : 0.6}
            py={2}
            flex={1}
            onPress={() => this.sign_Out()}
          >
            <Center>
              <Icon
                mb={1}
                as={<MaterialCommunityIcons name="login" />}
                color="white"
                size="xs"
              />

              <Text color="white" fontSize={14}>Logout</Text>
            </Center>
          </Pressable>
          {this.state.divisi == 7 ? (
            <Pressable
            opacity={this.state.selected === 2 ? 1 : 0.6}
            py={2}
            flex={1}
            onPress={() => this.setState({ selected: 2 }, this.props.navigation.navigate('Visit Sales', { divisi: this.state.divisi, user: this.state.id }))}
          >
            <Center>
              <Icon
                mb={1}
                as={<MaterialCommunityIcons name="newspaper" />}
                color="white"
                size="xs"
              />

              <Text color="white" fontSize={14}>Visit Sales</Text>
            </Center>
          </Pressable>
          ): null}
          <Pressable
            opacity={this.state.selected === 3 ? 1 : 0.6}
            py={2}
            flex={1}
            onPress={() => this.setState({ selected: 3 }, this.props.navigation.navigate('Absen', { id: this.state.id }))}
          >
            <Center>
              <Icon
                mb={1}
                as={<FontAwesome name="user-o" />}
                color="white"
                size="xs"
              />

              <Text color="white" fontSize={14}>ABSEN</Text>
            </Center>
          </Pressable>
        </HStack>
      );
    }else{

      return(
      
        <HStack style={{backgroundColor:'#172A7B'}} alignItems="center" safeAreaBottom shadow={6}>
            <Pressable
              opacity={this.state.selected === 1 ? 1 : 0.5}
              py={2}
              flex={1}
              onPress={() => this.setState({url: BASE_URL, selected: 1})}
            >
              <Center>
                <Icon
                  mb={1}
                  as={<MaterialCommunityIcons name="home" />}
                  color="white"
                  size="xs"
                />
                <Text color="white" fontSize={14}>Beranda</Text>
              </Center>
            </Pressable>
            <Pressable
              opacity={this.state.selected === 3 ? 1 : 0.5}
              py={2}
              flex={1}
              onPress={() => this.setState({selected: 3}, this.props.navigation.navigate('SignIn'))}
            >
              <Center>
                <Icon
                  mb={1}
                  as={<MaterialCommunityIcons name="login" />}
                  color="white"
                  size="xs"
                />
                <Text color="white" fontSize={14}>Login</Text>
              </Center>
            </Pressable>
          </HStack>
      );
    }
  }

  render() {

    console.log(this.state.url);
    return (
      <NativeBaseProvider>
        <Box p={0} m={0} w={deviceWidth / 1} flex={1} bg='dark.100'>
          <StatusBar style="light" />
          <WebView
            startInLoadingState={true}
            style={styles.container}
            source={{ uri: this.state.url }}
            ref={(ref) => (this.webview = ref)}
            onNavigationStateChange={this.handleWebViewNavigationStateChange}
          />
        </Box>
        {this.version()}
        {this.menubar()}
      </NativeBaseProvider>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40
  },
  ScrollStyle: {
    backgroundColor: 'white',
    position: 'relative',
  }
});