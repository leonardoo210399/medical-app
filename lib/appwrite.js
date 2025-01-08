import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    Query,
    Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.aditya210399.CKD",
    projectId: "ckdprojectid",
    databaseId: "HealthManagementDatabaseId",
    userCollectionId: "UsersCollectionId",
    patientsCollectionId: "PatientsCollectionId",
    medicationsCollectionId: "MedicationsCollectionId",
};

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
    .setProject(appwriteConfig.projectId) // Your project ID
    .setPlatform(appwriteConfig.platform); // Your application ID or bundle ID.

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export async function createUser(email, password, username, doctor) {
    // Register User
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        );

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username);

        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl,
                doctor: doctor,
            }
        );
        await signIn(email, password);
        return newUser;
    } catch (error) {
        console.error("Error registering user:", error);
        throw new Error(error);
    }
}

// Sign In
export async function signIn(email, password) {
    try {
        const session = await account.createEmailPasswordSession(email, password);

        return session;
    } catch (error) {
        throw new Error(error);
    }
}

//
export async function patientProfileForm(form) {
    try {
        // Create a new patient profile document with the extended fields
        const newPatientProfile = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.patientsCollectionId,
            ID.unique(),
            {
                name: form.name,
                age: form.age,
                gender: form.gender,
                comorbidities: form.comorbidities,
                otherComorbidities: form.otherComorbidities,
                dialysis: form.dialysis,
                height: form.height,
                weight: form.weight,
                allergies: form.allergies,
                diagnosis: form.confirmedDiagnosis, // Maps 'confirmedDiagnosis' from form to 'diagnosis' in DB
                language: form.language,             // New Field: Language
                diet: form.diet,                     // New Field: Diet
                users: form.userId,                  // Link patient to user
            }
        );

        // Update the user's document in the users collection to link to this new patient profile
        const updatedUserProfile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            form.userId,
            {
                patients: newPatientProfile.$id,
            }
        );

        return newPatientProfile;
    } catch (error) {
        console.error('Error creating patient profile:', error);
        throw error; // Propagate the error to be handled by the caller
    }
}

export async function updatePatientProfile(item) {
    const result = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.patientsCollectionId,
        item.$id,
        {
            name: item.name,
            age: item.age,
            gender: item.gender,
            comorbidities: item.comorbidities,
            otherComorbidities: item.otherComorbidities,
            dialysis: item.dialysis,
            height: item.height,
            weight: item.weight,
            allergies: item.allergies,
            confirmedDiagnosis: item.confirmedDiagnosis,
            language: item.language,
            diet: item.diet,
        }
    );
    return result;
}

export const getPatientDetails = async (patientId) => {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.patientsCollectionId,
            [Query.equal("users", patientId)]

        );
        return response;
    } catch (error) {
        throw error;
    }
};

export async function getPatientCollection() {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.patientsCollectionId,
            [Query.orderDesc("$createdAt")]
        );
        // console.log(response);
        return response;
    } catch (error) {
        console.error("Error fetching patient collection:", error);
        throw error; // Re-throw the error if you want it to propagate
    }
}

export async function getMedicationCollection() {
    try {
        return await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.medicationsCollectionId
        );
    } catch (error) {
        console.error("Error fetching medication collection:", error);
        throw error;
    }
}

export async function getPatientMedicationList(userId) {
    try {
        return await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.medicationsCollectionId,
            [Query.equal("userMedication", userId)]
        );
    } catch (error) {
        console.error("Error fetching medication collection:", error);
        throw error;
    }
}

export async function deletePatientMedication(documentId) {
    const result = await databases.deleteDocument(
        appwriteConfig.databaseId, // databaseId
        appwriteConfig.medicationsCollectionId, // collectionId
        documentId // documentId
    );
}

export async function addMedication(medicationData) {
    try {
        const response = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.medicationsCollectionId,
            ID.unique(), // Unique document ID
            medicationData
        );
        return response;
    } catch (error) {
        console.error("Error creating medication:", error);
        throw error;
    }
}

export const updatePatientMedication = async (medicationId, data) => {
    try {
        const response = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.medicationsCollectionId,   // Replace with your medications collection ID
            medicationId,
            data
        );
        return response;
    } catch (error) {
        throw error;
    }
};

// Get Current User
export async function getCurrentUser() {
    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        if (!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (error) {
        console.log(error);
        return null;
    }
}

const addFollowUp = (followUpData) => {
    return databases.createDocument(
        'HealthManagementDatabaseId', // Replace with your Database ID
        'SchedulesCollectionId',                  // Replace with your FollowUps Collection ID
        ID.unique(),                   // Let Appwrite generate a unique ID
        followUpData
    );
};

/**
 * Fetches follow-up/dialysis schedules for a specific patient.
 * @param {string} patientId - The ID of the patient.
 * @returns {Promise} - The Appwrite promise.
 */
const getFollowUps = (patientId) => {
    return databases.listDocuments(
        'HealthManagementDatabaseId', // Replace with your Database ID
        'SchedulesCollectionId',                  // Replace with your FollowUps Collection ID
        [Query.equal('patientId', patientId), Query.orderDesc('scheduledDate')]
    );
};

export const deleteFollowUp = async (followUpId) => {
    try {
        await databases.deleteDocument('HealthManagementDatabaseId', 'SchedulesCollectionId', followUpId);
    } catch (error) {
        throw error;
    }
};

export const updateFollowUp = async (followUpId, data) => {
    try {
        const response = await databases.updateDocument(
            'HealthManagementDatabaseId', // Replace with your Database ID
            'SchedulesCollectionId',                  // Replace with your FollowUps Collection ID
            followUpId,
            data
        );
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * Fetches follow-up/dialysis schedules for a specific patient.
 * @param {string} patientId - The ID of the patient.
 * @returns {Promise} - The Appwrite promise.
 */
export const getFollowUpsByPatient = (patientId) => {
    return databases.listDocuments(
        'HealthManagementDatabaseId', // Replace with your Database ID
        'SchedulesCollectionId',                  // Replace with your FollowUps Collection ID
        [
            Query.equal('patientId', patientId),
            Query.orderDesc('scheduledDate')
        ]
    );
};
export const updateScheduleStatus = async (scheduleId, newStatus) => {
    try {
        const response = await databases.updateDocument('HealthManagementDatabaseId', 'SchedulesCollectionId', scheduleId, {
            status: newStatus,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// Sign Out
export async function signOut() {
    try {
        const session = await account.deleteSession("current");

        return session;
    } catch (error) {
        throw new Error(error);
    }
}

export {databases, addFollowUp, getFollowUps, Query};
