import {View, Text} from 'react-native'
import React, {useEffect, useState} from 'react'
import {databases} from "../../lib/appwrite";

import {SafeAreaView} from "react-native-safe-area-context";

const PatientList = () => {
    const [users, setUsers] = useState([])

    useEffect(() => {
        init()
    }, []);

    const init = async () => {
        const db = await databases.listDocuments(
            "HealthManagementDatabaseId",
            "PatientsCollectionId"
        )

        // setUsers(db.documents)
        console.log(db.documents)
    }


    return (
        <SafeAreaView className="items-center flex-1 justify-center">
            {/*{users.map(user => (*/}
            {/*    <View key={user.$id} style={{display: "flex", flexDirection: 'row', justifyContent: "space-between"}}>*/}
            {/*        <Text style={{padding: 10}}>{user.patients.name}</Text>*/}
            {/*        /!*<Text style={{padding: 10}}>{user.patients.email}</Text>*!/*/}
            {/*        /!*<Text style={{padding: 10}}>{user.patients.role}</Text>*!/*/}
            {/*    </View>*/}
            {/*))}*/}
        </SafeAreaView>
    )
}
export default PatientList
