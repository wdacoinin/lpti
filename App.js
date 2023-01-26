import * as React from 'react';
import Constants from 'expo-constants';
import { Dimensions, Alert } from 'react-native';
import { Button, Icon, Image, Stack, Text, NativeBaseProvider, Center, Input } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons, FontAwesome, Ionicons } from "@expo/vector-icons"
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BASE_URL } from "./component/Server";
import HomeScreen from './app/Home';
import Absen from './app/Absen';
import Ambilfoto from './app/Ambilfoto';
import FotoKlien from './app/FotoKlien';
import VisitSales from './app/VisitSales';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';
import { createDrawerNavigator } from '@react-navigation/drawer';
import db from './database';
const deviceWidth = Dimensions.get("window").width;

const AuthContext = React.createContext();

function SplashScreen() {

  const [user, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { signOut } = React.useContext(AuthContext);

  return (

    <NativeBaseProvider>
      <Center flex={1}>
        <Text>Loading...</Text>
      </Center>
    </NativeBaseProvider>
  );
}


function SignInScreen() {
  const [user, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { signIn } = React.useContext(AuthContext);

  return (
    <NativeBaseProvider>
      <Center flex={1} style={{ backgroundColor: '#ffffff' }}>
        <Stack space={4} w="90%">
          <Image
            source={require('./assets/adaptive-icon.png')}
            alt="axie"
            style={{ alignSelf: 'center' }}
            size={deviceWidth / 2.8}
          />
          <Input
            size="xs"
            placeholder="Username"
            //secureTextEntry
            style={{ textAlign: 'center' }}
            value={user}
            onChangeText={setUsername}
            _light={{
              placeholderTextColor: "blueGray.400",
            }}
            _dark={{
              placeholderTextColor: "blueGray.50",
            }}
          />
          <Input
            size="xs"
            placeholder="Password"
            secureTextEntry
            style={{ textAlign: 'center' }}
            value={password}
            onChangeText={setPassword}
            _light={{
              placeholderTextColor: "blueGray.400",
            }}
            _dark={{
              placeholderTextColor: "blueGray.50",
            }}
          />
          <Button style={{ backgroundColor: '#172A7B' }}
            startIcon={<Icon as={MaterialCommunityIcons} name="login" size={5} />}
            onPress={() => signIn({ user, password })} >Sign in</Button>
        </Stack>
      </Center>
    </NativeBaseProvider>
  );
}

function Logout() {
  const [user, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { signOut } = React.useContext(AuthContext);

  return (
    <NativeBaseProvider>
      <Center flex={1} style={{ backgroundColor: '#ffffff' }}>
        <Stack space={4} w="90%">
          <Image
            source={require('./assets/adaptive-icon.png')}
            alt="axie"
            style={{ alignSelf: 'center' }}
            size={deviceWidth / 2.2}
          />
          <Button style={{ backgroundColor: '#172A7B' }}
            startIcon={<Icon as={MaterialCommunityIcons} name="login" size={5} />}
            onPress={() => signOut({ user })} >Keluar</Button>
        </Stack>
      </Center>
    </NativeBaseProvider>
  );
}

const Stacks = createNativeStackNavigator();

const Drawer = createDrawerNavigator();

function Dwr({ navigation }) {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Stacks.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} initialParams={{ log: 2 }} />
      <Stacks.Screen name="Logout" component={Logout} options={{ headerShown: false }} />
    </Drawer.Navigator>
  );
}

export default function App({ navigation }) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.username,
            level: 1,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.username,
            level: 2,
            isLoading: false,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            level: 0,
            isLoading: false,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      level: 0,
    }
  );



  React.useEffect(() => {


    // Fetch the username from storage then navigate to our appropriate place
    const bootstrapAsync = async () => {
      let userToken;
      state.isLoading = true;
      //let isLoading;

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // ... notify user of update ...
          Updates.reloadAsync();
        }
      } catch (e) {
        // handle or log error
      }


      console.log({ username: state.userToken, loading: state.isLoading, level: state.level });

      try {
        // Restore username stored in `SecureStore` or any other encrypted storage
        //userToken = await SecureStore.getItemAsync();
        //console.log(state.userToken);

        db.transaction(
          tx => {
            //tx.executeSql("drop table if exists appusers");
            tx.executeSql("create table if not exists appusers (id integer primary key not null, username text, divisi integer, password text, nama text);");
            tx.executeSql("create table if not exists notification (id integer primary key not null, date text, title text, isi text);");
            tx.executeSql('select username from appusers', [], (_, { rows }) => {
              console.log({ manyrows: rows.length });
              if (rows.length > 0) {
                var data = rows._array;
                dispatch({ type: 'SIGN_IN', username: data[0].username });
                console.log({ done: 'SIGN_IN', data: data });
              } else {
                dispatch({ type: 'RESTORE_TOKEN', username: userToken });
                console.log({ done: 'RESTORE_TOKEN' });
              }
            })
          },
          null
        );
        /* if(state.userToken == 'dummy-username' && state.isLoading == true){
          dispatch({ type: 'RESTORE_TOKEN', username: userToken, divisi: null });
        } */
      } catch (e) {
        // Restoring username failed
        //console.log(e);
      }


      // After restoring username, we may need to validate it in production apps



      // This will switch to the App screen or Auth screen and this loading
      // screen will be unmounted and thrown away.
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (data) => {
        // In a production app, we need to send some data (usually user, password) to server and get a username
        // We will also need to handle errors if sign in failed
        // After getting username, we need to persist the username using `SecureStore` or any other encrypted storage
        // In the example, we'll use a dummy username


        if (data.user != '') {


          db.transaction(tx => {
            tx.executeSql("drop table if exists appusers");
            tx.executeSql("create table if not exists appusers (id integer primary key not null, username text, divisi integer, password text, nama text, nama_divisi text);");
            tx.executeSql("create table if not exists notification (id integer primary key not null, date text, title text, isi text);");
          });
          console.log({ done: 'db created', data: data });

            const formData = new FormData();
            //formData.append('token', token);
            formData.append('username', data.user);
            formData.append('password', data.password);
            const options = {
              method: 'POST',
              body: formData,
              headers: {
                'Accept': 'application/json',
                //'Content-Type': 'application/json',
                'Content-Type': 'multipart/form-data',
              },
            };
            try {
              const url = BASE_URL + '/web/index.php?r=apiandroid/verify';
              const response = await fetch(url, options);
              const responseJson = await response.json();

              if (responseJson.hasil === 'success') {
                var user = responseJson.user;
                console.log({ url: url, dataOnline: user })
                var query = "insert into appusers (id, username, divisi, nama, nama_divisi) values (\
                  '" + user.id + "',\
                  '" + user.username + "',\
                  '" + user.divisi + "',\
                  '" + user.nama + "',\
                  '" + user.nama_divisi + "')";

                //execute save
                db.transaction(
                  tx => {
                    tx.executeSql(query);
                  },
                  null
                );

                dispatch({ type: 'SIGN_IN', username: user.username });
              } else {

                dispatch({ type: 'SIGN_OUT', username: 'dummy-username' });
                Alert.alert(
                  'LPTI',
                  'User tidak ditemukan di database',
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

        } else {
          dispatch({ type: 'SIGN_OUT', username: 'dummy-username' });
          Alert.alert(
            'LPTI',
            'Isi User',
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

      },
      signOut: () => {
        db.transaction(
          tx => {
            tx.executeSql("drop table if exists appusers");
            tx.executeSql("create table if not exists appusers (id integer primary key not null, username text, divisi integer, password text, nama text, nama_divisi text);");
            //tx.executeSql("drop table if exists notification");
            console.log({ done: 'signOut' });
          },
          null
        );
        dispatch({ type: 'SIGN_OUT', username: 'dummy-username' })
      },
      signUp: async (data) => {
        // In a production app, we need to send user data to server and get a username
        // We will also need to handle errors if sign up failed
        // After getting username, we need to persist the username using `SecureStore` or any other encrypted storage
        // In the example, we'll use a dummy username

        dispatch({ type: 'SIGN_IN', username: 'dummy-username' });
      },
    }),
    []
  );

  function MyApp(navigation) {
    console.log({ levelloading: state.level, loading: state.isLoading });
    if (state.isLoading == true && state.level == 0) {
      return (
        <Stacks.Navigator initialRouteName="SplashScreen">
          <Stacks.Screen name="SplashScreen" component={SplashScreen}
            options={{ headerShown: false }} />
          <Stacks.Screen
            name="SignIn"
            component={SignInScreen}
            options={{
              headerShown: false,
              title: 'Sign in',
              // When logging out, a pop animation feels intuitive
              animationTypeForReplace: state.isSignout ? 'pop' : 'push',
            }}
          />
        </Stacks.Navigator>
      );
    } else if (state.isLoading == false && state.level > 1) {
      return (
        <Stacks.Navigator>
          <Stacks.Group initialRouteName="Home">
            <Stacks.Screen name="Dwr" component={Dwr} options={{ headerShown: false }} />
            <Stacks.Screen name="Absen" component={Absen} options={{ headerShown: true }} />
            <Stacks.Screen name="Visit Sales" component={VisitSales} options={{ headerShown: true }} />
            <Stacks.Screen name="Ambilfoto" component={Ambilfoto} options={{ headerShown: true }} />
            <Stacks.Screen name="Foto Klien" component={FotoKlien} options={{ headerShown: true }} />
            <Stacks.Screen name="Logout" component={Logout} options={{ headerShown: false }} />
          </Stacks.Group>
        </Stacks.Navigator>
      );
    } else {
      return (
        <Stacks.Navigator>
          <Stacks.Group initialRouteName="Home">
            <Stacks.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} initialParams={{ log: 0 }} />
            <Stacks.Screen
              name="SignIn"
              component={SignInScreen}
              options={{
                headerShown: false,
                title: 'Sign in',
                // When logging out, a pop animation feels intuitive
                animationTypeForReplace: state.isSignout ? 'pop' : 'push',
              }}
            />
          </Stacks.Group>
        </Stacks.Navigator>
      );
    }
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <MyApp />
      </NavigationContainer>
    </AuthContext.Provider>
  );
}