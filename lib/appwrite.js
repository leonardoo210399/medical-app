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

export async function patientProfileForm(form) {
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
      diagnosis: form.confirmedDiagnosis,
      users: form.userId, // Link patient to user
    }
  );

  console.log("New Patient Profile Created:", newPatientProfile);

  // Update the user's document in the users collection to link to this new patient profile
  const updatedUserProfile = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    form.userId,
    {
      patients: newPatientProfile.$id,
    }
  );

  console.log("Updated User Profile:", updatedUserProfile);

  return newPatientProfile;
}

export async function updatePatientProfile(item) {
  const result = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.patientsCollectionId,
    item.$id,
    {
      name:item.name,
      age:item.age,
      gender:item.gender,
      comorbidities:item.comorbidities,
      otherComorbidities:item.otherComorbidities,
      dialysis:item.dialysis,
      height:item.height,
      weight:item.weight,
      allergies:item.allergies,
      confirmedDiagnosis:item.confirmedDiagnosis,
    } // data (optional)
  );
  return result;
}

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

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}


export { databases, Query };
