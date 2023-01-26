import React from 'react';
import { 
  StyleSheet,
  View,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Picker,
  Alert,
  Image,
  Dimensions,
  AppRegistry,
  TouchableOpacity,
  BackHandler
}
from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { BASE_URL } from "../component/Server";
import { HStack, VStack, Box, Icon, Pressable, Input, Button, Text, Modal, NativeBaseProvider, Center } from 'native-base';
import { StatusBar } from 'expo-status-bar';
import db from '../database';
import moment from 'moment';
import 'moment/locale/id';
import _ from 'lodash';
import Constants from 'expo-constants';
import { MaterialCommunityIcons, FontAwesome, Ionicons } from "@expo/vector-icons"
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
const deviceHeight = Dimensions.get("window").height;
const deviceWidth = Dimensions.get("window").width;

//const latitude = [ '-6.992', '-6.996', '-7.009' ];
//const longitude = [ '110.395', '110.403', '110.461' ];

export default class Absen extends React.Component {
    _isMounted = false;
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isConnected: null,
            id: null,
            nama: null,
            timestamp: null,
            imgnumb: 0,
            hasCameraPermission: null,
            type: Camera.Constants.Type.back,
            autoFocus: 'on',
            ratio: '16:9',
            ratios: [],
            cameraTogle: false,
            newPhotos: false,
            koor: false,
            item: null,
            image: null,
            file: null,
            fileType: null,
            base64: null,
            url: '',
			lat: '',
			lon: '',
        }
        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    }

    credential = () => {
        db.transaction(
            tx => {
              tx.executeSql('select id, nama from appusers', [], (_, {rows: {_array}}) =>
                    {
                        this.setState({
                            id:_array[0].id,
                            nama:_array[0].nama
                        });
                        
                        this.checkimg();
                    }
              );
            },
            null
        );
        
    }

    componentDidMount () {
        this.cameraState();
        this.credential();
        //this.fetching();
        NetInfo.fetch().then(state => {
            console.log("Connection type", state.type);
            console.log("Is connected?", state.isConnected);
            this.setState({
                isConnected:true,
             })
        });
        this._getLocationAsync();
    }

    UNSAFE_componentWillMount(){
    this._isMounted = true;
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    UNSAFE_UNSAFE_componentWillMount(){
    this._isMounted = false;
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
    //alert('You clicked back. Now Screen will move to ThirdPage');
    // We can move to any screen. If we want
    this.props.navigation.goBack('Login');
    // Returning true means we have handled the backpress
    // Returning false means we haven't handled the backpress
    return true;
    }

 	
    _getLocationAsync = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        /* if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        } */
  
        let check = await Location.getProviderStatusAsync();
        var gps = check.gpsAvailable;
        var inet = check.networkAvailable;
        console.log({ gps: gps })

        if (inet === true && status === 'granted' && gps === true) {
            await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest
            })
            .then(position => {
                var data = position.coords;

                console.log({lat:data.latitude, lon: data.longitude});
                /*var lt = '' + data.latitude + '';
                var lo = '' + data.longitude + '';
                var latstr = lt.substr(0, 6);
                var lonstr = lo.substr(0, 7);

                var foundlat = latitude.find(element => element === latstr);
                var foundlon = longitude.find(element => element === lonstr);
                
                console.log({lat: foundlat, lon: foundlon});
                if(foundlat !== undefined && foundlon !== undefined){*/
                this.setState({
                    lat: data.latitude,
                    lon: data.longitude,
                    koor: true,
                    refresh: false
                });
               /* }else{
                    this.setState({
                        lat: '',
                        lon: '',
                        koor: false,
                        refresh: false
                    });
                }*/
            })
            .catch(error => {
              console.log(error);
            });
        } else {
            Alert.alert(
                'LPTI',
                'Gps harus di hidupkan/Akses lokasi belum diterima',
                [
                    {
                        text: 'OK', onPress: () => {
                            this.props.navigation.goBack(null)
                            console.log('OK Pressed')
                        }
                    },
                ],
                { cancelable: false }
            );
        }
    }

       //modul camera

    checkimg = async () => {
        console.log({server:BASE_URL});
        this.setState({
            isLoading: true
        });
        const formData = new FormData();
        formData.append('getimg', true);
        formData.append('id', this.state.id);
        formData.append('datetime', moment(new Date()).format('YYYY-MM-DD'));
        const options = {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        };
        try {
            const url = BASE_URL + '/web/index.php?r=apiandroid/checkimg';
            const response = await fetch(url, options);
            const responseJson = await response.json();
            console.log({ cards: responseJson.hasil })
            if (responseJson.hasil === 'ada') {

                this.setState({
                    imgnumb: 1,
                    timestamp: responseJson.datetime,
                    url: responseJson.url,
                    isLoading: false
                });
            } else {
                this.setState({
                    imgnumb: responseJson.hasil,
                    isLoading: false
                });
            }

        }
        catch (error) {
            console.log(error);
            Alert.alert(
                'LPTI',
                'Tidak terhubung server',
                [
                    {
                        text: 'OK', onPress: () => {
                            console.log('OK Pressed')
                        }
                    },
                ],
                { cancelable: false }
            );
        }
    }

    simpanimg = async () => {

        if (this.state.imgnumb > 0) {
            Alert.alert(
                'LPTI',
                'Hari ini sudah absen',
                [
                    {
                        text: 'OK', onPress: () => {
                            console.log('OK Pressed')
                        }
                    },
                ],
                { cancelable: false }
            );
        } else {

            let { image } = this.state;
            const urlfile = image;
            const uriParts = urlfile.split('.');
            const fileType = uriParts[uriParts.length - 1];
            var nama = this.state.nama;

            var timestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            const file = `data:image/${fileType};base64,${this.state.base64}`;
            
            console.log({
                id: this.state.id,
                lat: this.state.lat,
                lon: this.state.lon,
                fileType: fileType,
                nama: nama,
            })
            if (this.state.lat !== '' && this.state.lon !== '') {
                const formData = new FormData();
                formData.append('save_img', true);
                formData.append('id', this.state.id);
                formData.append('timestamp', timestamp);
                formData.append('lat', this.state.lat);
                formData.append('lon', this.state.lon);
                formData.append('nama', nama);
                formData.append('img', file);
                formData.append('filetype', fileType);
                const options = {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    },
                };
                try {
                    const url = BASE_URL + '/web/index.php?r=apiandroid/saveimg';
                    const response = await fetch(url, options);
                    const responseJson = await response.json();

                    console.log({ hasil: responseJson.hasil })
                    if (responseJson.hasil === 'success') {
                        this.setState({
                            isLoading: false,
                            cameraTogle: false
                        });
                        this.checkimg();
                        Alert.alert(
                            'LPTI',
                            'Foto berhasi disimpan',
                            [
                                {
                                    text: 'OK', onPress: () => {
                                        console.log('OK Pressed')
                                    }
                                },
                            ],
                            { cancelable: false }
                        );
                    } else {
                        Alert.alert(
                            'LPTI',
                            responseJson.hasil,
                            [
                                {
                                    text: 'OK', onPress: () => {
                                        console.log('OK Pressed')
                                    }
                                },
                            ],
                            { cancelable: false }
                        );
                    }

                }
                catch (error) {
                    console.log(error);
                    Alert.alert(
                        'LPTI',
                        'Koneksi bermasalah',
                        [
                            {
                                text: 'OK', onPress: () => {
                                    console.log('OK Pressed')
                                }
                            },
                        ],
                        { cancelable: false }
                    );
                }
            } else {
                Alert.alert(
                    'LPTI',
                    'Harus di area Outlet',
                    [
                        {
                            text: 'OK', onPress: () => {
                                console.log('OK Pressed')
                            }
                        },
                    ],
                    { cancelable: false }
                );
            }

        }

    }

    async cameraState() {
        const { status } = await Camera.requestCameraPermissionsAsync();
        this.setState({ hasCameraPermission: status === 'granted' });
    }

    snap = async () => {

        let result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.5, base64: true });

        //console.log(result);

        if (!result.cancelled) {

            this.setState({ newPhotos: true, form: !this.state.form, cameraTogle: true, image: result.uri, base64: result.base64 });

            console.log({
                imgUri: this.state.image,
            });

            this.simpanimg();

        } else {
            this.setState({ newPhotos: false });
        }

    }


    render(){
        
            return (
                <NativeBaseProvider>
                <Box p={0} m={0} w={deviceWidth / 1} flex={1} bg='dark.100'>
                <StatusBar style="dark" />
                        {this.state.imgnumb === 0 ?
                        <View style={styles.icocontainer}>
                            <VStack>
                            <Center>
                                <TouchableOpacity style={styles.iconbtn} onPress={() => this.snap()}>
                                <Image style={styles.ico}
                                    source={require('../assets/Camera.png')}>
                                </Image>
                                </TouchableOpacity>
                            </Center>
                            <Center style={{marginTop:50}}>
                                <Text style={styles.tittle}>Foto Absensi</Text>
                            </Center>
                            </VStack>
                        </View>
                            :
                            <View style={{ flex: 1, flexDirection: 'column'}}>
                            
                                <Text style={styles.tittle}>Hari ini sudah absen Jam:</Text>
                                <Text style={[styles.tittle, {fontSize: 16, fontWeight: 'bold'}]}>{moment(this.state.timestamp).format('DD MMMM YYYY')}</Text>
                                <Text style={[styles.tittle, {fontSize: 21, fontWeight: 'bold'}]}>{moment(this.state.timestamp).format('HH:mm:ss')}</Text>
                            
                                <Image source={{ uri: BASE_URL + this.state.url }} style={{width: deviceWidth/1, height: deviceHeight/2}} resizeMode='contain' />
                            
                            </View>
                        }
                </Box>
                </NativeBaseProvider>
            );

    }
}

const styles = StyleSheet.create({
    container: {
        marginTop:40,
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        flexDirection: 'row'
    },
    icocontainer: {
        width:deviceWidth/1,
        marginTop: deviceHeight/2,
        flexDirection:'column',
        justifyContent: 'space-around',
    },
    iconbtn:{
        paddingVertical: 20,
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1
    },
    ico: {
        width: 75,
        height: 75
    },
    tittle: {
        color: '#aaa',
        fontSize: 15,
        textAlign: 'center',
        opacity:0.9,
        padding: 10
    },
    buttonContainer: {
        backgroundColor: '#f7c744',
        paddingVertical: 13
    },
    buttonText: {
        textAlign: 'center',
        fontWeight: 'bold'
    }
})
AppRegistry.registerComponent('NetworkCheck', () => IsConnected);