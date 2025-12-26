export const MESSAGES = {
    // Welcome & Onboarding
    welcome: "Welcome to Watch Party 🎉!",
    createUserPrompt: "Please create a user to get started",
    createProfilePrompt: "Create your profile to get started",

    // Success Messages
    copiedToClipboard: "Copied to clipboard!",

    // Error Messages
    usernameRequired: "Please enter a username",
    roomNameRequired: "Please enter a room name",
    roomNameTooLong: "Room name must be 50 characters or less",
    streamUrlRequired: "Please enter a stream URL",
    createRoomFailed: "Failed to create room. Please try again.",
    createUserFailed: "Failed to create user",

    // Loading States
    creatingUser: "Creating user...",
    creatingRoom: "Creating...",
    loadingRoom: "Loading room...",

    // Status Messages
    connected: "Connected",
    disconnected: "Disconnected",

    // Empty States
    noRoomsCreated:
        "Looks like you have not created any rooms yet. Please use Create Room to create a new room!",
    noRecentRooms:
        "Looks like you haven't joined any rooms recently. Ask your friends for the room link to join their rooms!",
} as const;
