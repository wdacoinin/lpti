import React, { Component } from 'react';
import { Dimensions } from 'react-native';
import { Header, Left, Body, Right, Title, Subtitle, Icon, View } from 'native-base';
import styles from "../newstyle";
import _ from 'lodash';
const deviceHeight = Dimensions.get("window").height;
//const deviceWidth = Dimensions.get("window").width;

const dw = Dimensions.get("window").width;

const deviceWidth = () => {
    const n = dw > 360 ? parseFloat(dw) : 400;
    return n;
};

const splitroute = (input) => {
    console.log(input)
    if (input !== null) {
    const result = input.match(/[A-Z][a-z]+|[0-9]+/g).join(" ");
    return result;
    }
}
//modul camera
const HeaderSS = props => {
    const refresh = { refresh: true };
    //const route = toString(props.route).split(/(?=[A-Z])/);
    return (
        <View>
            <Header style={[styles.mainHeader, {height: deviceHeight/8}]}>
                <Left style={styles.LeftHeaderCont}>
                    {props.route !== 'PenawaranBaru' ?
                    <Icon name='arrow-back' style={styles.LeftHeaderIcon}
                    onPress={() => props.navigation.navigate('Visit')}
                    />
                    :
                    <Icon name='arrow-back' style={styles.LeftHeaderIcon}
                    onPress={() => props.navigation.goBack(null)}
                    />
                    }
                </Left>
                <Body style={[styles.BodyHeaderCont, { flex: 2}]}>
                    <Title style={styles.BodyMainTitle}>Visit</Title>
                    <Subtitle style={styles.BodySubtitle}>{splitroute(props.route)}</Subtitle>
                </Body>
                <Right>
                </Right>
            </Header>
        </View>
    );
}

export default HeaderSS;

//