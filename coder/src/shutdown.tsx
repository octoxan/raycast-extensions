import { Detail, getPreferenceValues, confirmAlert, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";

export interface Preferences {
  coderAPIKey: string;
  coderUserID: string;
  coderUserName: string;
}

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.coderAPIKey;
  const userId = preferences.coderUserID;

  // Fetch the list of workspaces
  const fetchWorkspaces = async () => {
    const response = await fetch(
      `https://embold.dev/api/v0/workspaces?users=${userId}`,
      {
        headers: {
          "Session-Token": apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch workspaces.");
      throw new Error("Failed to fetch workspaces.");
    }

    const data = await response.json();

    // Assuming the data you provided is an array of workspace objects
    const workspaces = data.map((workspace: any) => ({
      id: workspace.id,
      name: workspace.name,
      status: workspace.provider_status.container_status,
      // Add the rest of the properties here based on the interface above
      // For example: image_id: workspace.image_id, image_tag: workspace.image_tag, etc.
    })) as SearchResult[];

    // Shut down all workspaces automatically
    workspaces.forEach((workspace) => {
      if (workspace.status !== "OFF") {
        shutdownWorkspace(workspace);
      }
    });
  };

  if (await confirmAlert({ title: "Are you sure you want to shut down all workspaces?"})) {
    try {
      await fetchWorkspaces();
      showToast({ title: "Coder Shutdown", message: "All workspaces are shutting down!", style: Toast.Style.Success });
    } catch (error) {
      showToast({ title: "Coder Shutdown", message: "Failed to shut down all workspaces!", style: Toast.Style.Failure });
    }
  }
}

const shutdownWorkspace = async (workspace: SearchResult) => {
  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.coderAPIKey;

  try {
    // Implement the API call to shut down the workspace here
    const response = await fetch(
      `https://apidocs.embold.dev/api/v0/workspaces/${workspace.id}/stop`,
      {
        method: "PUT",
        headers: {
          "accept": "application/json",
          "Session-Token": apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to stop workspace ${workspace.name}.`);
    } else {
      console.log(`Workspace ${workspace.name} is shutting down.`);
    }
  } catch (error) {
    console.error("Error while stopping the workspace:", error);
  }
};

interface SearchResult {
  id: string;
  name: string;
  status: string;
  // Add other properties based on your actual API response
}
