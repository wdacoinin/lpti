import * as React from 'react';
import Constants from 'expo-constants';
import { StyleSheet, Dimensions, RefreshControl, BackHandler, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HStack, Box, FlatList, Spacer, Icon, VStack, Pressable, Text, NativeBaseProvider, Center, Modal, TextArea, FormControl, Button } from 'native-base';
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"
import { BASE_URL } from "../component/Server";
import { WebView } from 'react-native-webview';
import * as Permissions from 'expo-permissions';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import moment from 'moment';
import * as Location from 'expo-location'
import 'moment/locale/id';
const deviceWidth = Dimensions.get("window").width;
import db from '../database';


export default class VisitSales extends React.Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      divisi: null,
      url: null,
      selected: null,
      list: [],
      refreshing: false,
      search: '',
      count: null,
      open:false,
      editServices_sales: null,
      opennote: '',
      /* mocked: false,
      lat: '',
      lon: '', */
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    //this.getLocationAsync();
    const { divisi } = this.props.route.params;
    const { user } = this.props.route.params;
    this.setState({
      divisi: divisi,
      user: user,
      //refreshing: true,
    });
    setTimeout(() => {
      this.get(this.state.search, user);
      console.log('Refresh On did mount visit list');
    }, 500);
  }

  UNSAFE_componentWillMount() {
    this._isMounted = true;
    this.focusListener = this.props.navigation.addListener('focus', () => {
      this.setState({
        refreshing: true,
        search: this.state.search,
      });
      this.onRefresh(this.state.search);
      //Put your Data loading function here instead of my this.loadData()
    });
    console.log('visit list');
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
  }

  componentWillUnmount() {
    this._isMounted = false;
    /* this.focusListener = this.props.navigation.removeListener('focus', () => {
    }); */
    console.log('leave screen visit list');
  }

  handleBackButtonClick() {
    //alert('You clicked back. Now Screen will move to ThirdPage');
    // We can move to any screen. If we want
    this.props.navigation.navigate('Home', { url: BASE_URL + '/web/index.php?r=home&user=' + this.state.user });
    // Returning true means we have handled the backpress
    // Returning false means we haven't handled the backpress
    return true;
  }

  onRefresh = (search) => {
    this.get(search, this.state.user);
  }

  get = async (search, user) => {

    const formData = new FormData();
    formData.append('getlist', true);
    const options = {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    };
    try {
      const url = BASE_URL + '/web/index.php?r=android/visitsales&user=' + user;

      console.log({ responseJson: url });
      const response = await fetch(url, options);
      const responseJson = await response.json();

      var count = responseJson.count;
      if (responseJson.hasil === 'success') {
        var list = responseJson.list;
        this.setState({
          list: list,
          refreshing: false,
          count: count,
        });
      } else {
        this.setState({
          refreshing: false,
          count: count,
        });
      }

    }
    catch (error) {
      console.log(error);
    }
  }

  saveNote = async () => {

    if(this.state.editServices_sales != '' && this.state.open){

      console.log({ opennote: this.state.opennote });
      this.setState({open:false})
      const formData = new FormData();
      formData.append('services_sales_note', this.state.opennote);
      formData.append('services_sales', this.state.editServices_sales);
      const options = {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      };
      try {
        const url = BASE_URL + '/web/index.php?r=android/savenote';
  
        const response = await fetch(url, options);
        const responseJson = await response.json();
        if (responseJson.hasil === 'success') {
            
            Alert.alert(
                'LPTI',
                'Catatan berhasi disimpan',
                [
                    {
                        text: 'OK', onPress: () => { 
                          this.setState({
                            refreshing: true,
                            search: this.state.search,
                          });
                          this.onRefresh(this.state.search);
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
      }
    }
  }

  modal = () => {
    if(this.state.open){
      return(
        <Modal isOpen={this.state.open} onClose={() => this.setState({open:false})} safeAreaTop={true}>
        <Modal.Content maxWidth="350">
          <Modal.CloseButton />
          <Modal.Header>Form</Modal.Header>
          <Modal.Body>
            <FormControl>
              <FormControl.Label>Catatan Visit</FormControl.Label>
              <TextArea value={this.state.opennote} onChangeText={text => this.setState({opennote: text})} />
            </FormControl>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => {
              this.setState({open:false});
            }}>
                Cancel
              </Button>
              <Button onPress={() => {
                this.saveNote();
                }}>
                Save
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
      )
    }
  }

  download = async () => {

    let url = 'https://lpti.wdasoft.com/web/uploads/files/template_proposal.docx';
    var filename = 'proposal.pdf';

    var fileUri = `${FileSystem.documentDirectory}${filename}`;
    var downloadedFile = await FileSystem.downloadAsync(url, fileUri);


    if (downloadedFile.status != 200) {
      console.log(downloadedFile.status);
    }

    
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status != 'granted') {
      return;
    }

    try {
      const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
      console.log(asset);debugger
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (e) {
      console.log(e);
    }

  }

  headerup = () => {
      return(
        <HStack bg="primary.500" alignItems="center" shadow={6} px={4} pt={3} pb={3}>
        <Center w="100%" >
        <Box w="100%" space={5} alignSelf="center">
          <Button variant="subtle" endIcon={<Icon as={Ionicons} name="cloud-download-outline" size="sm" />} onPress={() => this.download()}>
            Download Proposal
          </Button>
        </Box>
        </Center>
        </HStack>
      )
  }

  render() {

    console.log({opennote: this.state.opennote})
    console.log({ screen: 'on screen Visit', url: this.state.url, refreshing: this.state.refreshing });
    return (
      <NativeBaseProvider>
        <Box p={0} m={0} w={deviceWidth / 1} flex={1} bg='light.100'>
          <StatusBar style="dark" />
          {this.headerup()}
          {this.state.count > 0 ?
          (
          <FlatList
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={() => { this.setState({ refreshing: true }), this.onRefresh(this.state.search) }}
              />
            }
            data={this.state.list} renderItem={({ item }) =>
              <Box borderBottomWidth="1" _dark={{ borderColor: "muted.50" }} borderColor="muted.300" py="1" px="5">
                <HStack space={[2]} justifyContent="space-between">
                  <VStack>
                    <Text fontSize="sm" _dark={{ color: "warmGray.50" }} color="coolGray.800" alignSelf="flex-start" paddingTop={"1"} maxW="300" w="90%">
                      Klien: {item.klien}
                    </Text>
                    <Text fontSize="xs" _dark={{ color: "warmGray.50" }} color="coolGray.800" alignSelf="flex-start" paddingTop={"2"} maxW="300" w="90%">
                      Alamat: {item.alamat}
                    </Text>
                    <Text fontSize="xs" color="coolGray.400" _dark={{
                      color: "warmGray.200"
                    }}>
                      Tgl: {item.tgl}
                    </Text>
                    <Text fontSize="xs" color="coolGray.400" _dark={{
                      color: "warmGray.200"
                    }}>
                      Service: {item.service_nama}
                    </Text>
                  </VStack>
                  {
                    item.status == 0 ?
                      (<HStack space={2} py="1" px="1">
                        <Center>
                          <VStack justifyContent={"center"} h="12" flexWrap="wrap">
                            <Pressable
                              //opacity={this.state.selected === 1 ? 1 : 0.5}
                              py={2}
                              flex={1}
                              onPress={() => this.setState({open:true, editServices_sales: item.services_sales, opennote: item.services_sales_note})}
                            >
                              <Center>
                                <Icon
                                  mb={1}
                                  as={<MaterialCommunityIcons name="pencil-circle" />}
                                  color="success.400"
                                  size="lg"
                                />
                              </Center>
                            </Pressable>
                            <Text fontSize="xs" color="coolGray.400" _dark={{
                              color: "warmGray.200"
                            }}>
                              Note
                            </Text>
                          </VStack>
                        </Center>
                        <Center>
                          <VStack justifyContent={"center"} h="12" flexWrap="wrap">
                            <Pressable
                              opacity={this.state.selected === 1 ? 1 : 0.5}
                              py={2}
                              flex={1}
                              onPress={() => this.setState({ selected: 1 }, this.props.navigation.navigate('Foto Klien', { services_sales: item.services_sales, sales: this.state.user }))}
                            >
                              <Center>
                                <Icon
                                  mb={1}
                                  as={<MaterialCommunityIcons name="camera" />}
                                  color="black"
                                  size="md"
                                />
                              </Center>
                            </Pressable>
                            <Text fontSize="xs" color="coolGray.400" _dark={{
                              color: "warmGray.200"
                            }}>
                              Foto
                            </Text>
                          </VStack>
                        </Center>
                      </HStack>
                      ) : (
                        <HStack space={2} py="1" px="1">
                        <Center>
                          <VStack justifyContent={"center"} h="12" flexWrap="wrap">
                            <Pressable
                              //opacity={this.state.selected === 1 ? 1 : 0.5}
                              py={2}
                              flex={1}
                              onPress={() => this.setState({open:true, editServices_sales: item.services_sales, opennote: item.services_sales_note})}
                                //this.props.navigation.navigate('Pembelian', { url: BASE_URL + '/web/index.php?r=userqr/pembelian&do=' + item.do + '&id=' + this.state.id })}
                            >
                              <Center>
                                <Icon
                                  mb={1}
                                  as={<MaterialCommunityIcons name="pencil-circle" />}
                                  color="success.400"
                                  size="lg"
                                />
                              </Center>
                            </Pressable>
                            <Text fontSize="xs" color="coolGray.400" _dark={{
                              color: "warmGray.200"
                            }}>
                              Note
                            </Text>
                          </VStack>
                        </Center>
                        <Center>
                          <VStack justifyContent={"center"} h="12" flexWrap="wrap">
                          <Icon
                            mb={1}
                            as={<MaterialCommunityIcons name="check-all" />}
                            color="success.600"
                            size="md"
                          />
                          </VStack>
                        </Center>
                      </HStack>
                      )}
                </HStack>
              </Box>
            } keyExtractor={item => item.services_sales} />
            ):(
              <Center flex={1}>
                  <Text fontSize="xs" color="coolGray.400">Tidak ada hasil pencarian.</Text>
              </Center>
            )
            }
        </Box>
        {this.modal()}
      </NativeBaseProvider>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0
  },
});