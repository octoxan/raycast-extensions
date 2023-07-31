import { ActionPanel, Action, Color, Detail, Icon, List, getPreferenceValues, openExtensionPreferences, showToast, Toast } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useEffect, useState } from "react";
import { filter } from 'lodash';
import fetch, { RequestInit } from "node-fetch"; 
import { exec } from "child_process";

export interface Preferences {
  coderAPIKey: string;
  coderUserID: string;
  coderUserName: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [workspaces, setWorkspaces] = useState<SearchResult[]>([]);

  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.coderAPIKey;
  const userId = preferences.coderUserID;
  const userName = preferences.coderUserName;

  if (!userName || !userId) {
    return (
      <Detail 
        markdown="Please set your Coder user ID and username in the extension preferences using the action menu in the lower right. 
          You can use the `User List with IDs` command to pull the correct ID and name."
        actions={
          <ActionPanel>
            <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
          </ActionPanel>
        }
      />
    );
  }

  // Fetch the updated list of workspaces
  const fetchWorkspaces = async (): Promise<SearchResult[]> => {
    try {
      const response = await fetch("https://embold.dev/api/v0/workspaces?users=" + userId, {
        headers: {
          'Session-Token': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workspaces.");
      }

      const json = (await response.json()) as any[];

      return json.map((workspace: any) => ({
        id: workspace.id,
        name: workspace.name,
        status: workspace.provider_status.container_status,
        // Add the rest of the properties here based on the interface above
        // For example: image_id: workspace.image_id, image_tag: workspace.image_tag, etc.
      })) as SearchResult[];
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      return [];
    }
  };

  const refreshWorkspaces = async () => {
    try {
      const updatedWorkspaces = await fetchWorkspaces();
      setWorkspaces(updatedWorkspaces);
    } catch (error) {
      console.error("Error refreshing workspaces:", error);
    }
  };

  // Initial fetch of workspaces on component mount
  useEffect(() => {
    refreshWorkspaces();
  }, []);

  // Refresh the workspaces every 2 seconds
  useEffect(() => {
    const interval = setInterval(refreshWorkspaces, 2000);

    // Clean up the interval when the component is unmounted
    return () => clearInterval(interval);
  }, []);

  // Filter the data based on the searchText
  const filteredData = searchText
    ? filter(workspaces, (workspace) => workspace.name.includes(searchText))
    : workspaces;

  // Separate workspaces into three arrays based on status
  const creatingWorkspaces = filteredData.filter((workspace) => workspace.status === "CREATING");
  const onWorkspaces = filteredData.filter((workspace) => workspace.status === "ON");
  const offWorkspaces = filteredData.filter((workspace) => workspace.status === "OFF");

  // Sort each array alphabetically by workspace name
  creatingWorkspaces.sort((a, b) => a.name.localeCompare(b.name));
  onWorkspaces.sort((a, b) => a.name.localeCompare(b.name));
  offWorkspaces.sort((a, b) => a.name.localeCompare(b.name));

  // Concatenate the sorted arrays to get the desired order
  const sortedWorkspaces = [...creatingWorkspaces, ...onWorkspaces, ...offWorkspaces];

  return (
    <List
      isLoading={workspaces.length === 0}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search workspaces.."
      throttle
    >
      <List.Section title="Workspaces" subtitle={sortedWorkspaces?.length + ""}>
        {sortedWorkspaces?.map((searchResult) => (
          <SearchListItem key={searchResult.name} searchResult={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ searchResult }: { searchResult: SearchResult }) {
  const preferences = getPreferenceValues<Preferences>();
  const userName = preferences.coderUserName;

  const [isStarting, setIsStarting] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Define functions for each action
   const startWorkspace = () => {
    // Set a state variable to indicate that the API call is in progress
    setIsStarting(true);
  };

  const rebuildWorkspace = () => {
    // Set a state variable to indicate that the API call is in progress
    setIsRebuilding(true);
  };

  const stopWorkspace = () => {
    // Set a state variable to indicate that the API call is in progress
    setIsStopping(true);
  };

  const runSSHRebuild = () => {
    const command = "coder config-ssh";

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Command execution stderr: ${stderr}`);
        return;
      }

      console.log(`Command executed successfully: ${stdout}`);
    });
  };

  useEffect(() => {
    const startWorkspaceAPI = async () => {
      const command = `coder workspaces rebuild ${searchResult.name} --force`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          return;
        }

        if (stderr) {
          console.error(`Command execution stderr: ${stderr}`);
          return;
        }

        console.log(`Command executed successfully: ${stdout}`);
      });
    };

    // Check if the API call should be made (isStarting is true)
    if (isStarting) {
      try {
        startWorkspaceAPI();
        showToast({ title: "Workspace Starting", message: `${searchResult.name} is starting!`, style: Toast.Style.Success });

      } catch (error) {
        showToast({ title: "Workspace Starting", message: `Failed to start ${searchResult.name}!`, style: Toast.Style.Failure });
      }
    }
  }, [isStarting]);

  useEffect(() => {
    const rebuildWorkspaceAPI = async () => {
      const command = `coder workspaces rebuild ${searchResult.name} --force`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          return;
        }

        if (stderr) {
          console.error(`Command execution stderr: ${stderr}`);
          return;
        }

        console.log(`Command executed successfully: ${stdout}`);
      });
    };

    // Check if the API call should be made (isRebuilding is true)
    if (isRebuilding) {
      rebuildWorkspaceAPI();
    }
  }, [isRebuilding]);

  useEffect(() => {
    // Define an async function to make the API call
    const stopWorkspaceAPI = async () => {
      try {
        // API URL for stopping the workspace
        const stopUrl = `https://apidocs.embold.dev/api/v0/workspaces/${searchResult.id}/stop`;

        // API key from preferences
        const preferences = getPreferenceValues<Preferences>();
        const apiKey = preferences.coderAPIKey;

        // Fetch options
        const options: RequestInit = {
          method: "PUT",
          headers: {
            "accept": "application/json",
            "Session-Token": apiKey,
          },
        } as RequestInit;

        // Make the API call to stop the workspace using node-fetch
        const response = await fetch(stopUrl, options);

        if (!response.ok) {
          // Handle error response
          console.error("Failed to stop the workspace.");
        } else {
          // Workspace stopped successfully
          console.log(`Workspace ${searchResult.name} is shutting down.`);
        }

        // Reset the state variable after the API call is done
        setIsStopping(false);
      } catch (error) {
        console.error("Error while stopping the workspace:", error);
        // Reset the state variable in case of an error
        setIsStopping(false);
      }
    };

    // Check if the API call should be made (isStopping is true)
    if (isStopping) {
      stopWorkspaceAPI();
    }
  }, [isStopping]);

  const openLocalVSC = () => {
    const command = `code --folder-uri=vscode-remote://ssh-remote+coder.${searchResult.name}/home/embold/code/${searchResult.name}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Command execution stderr: ${stderr}`);
        return;
      }

      console.log(`Command executed successfully: ${stdout}`);
    });
  };

  const isOffStatus = searchResult.status === "OFF";
  const isAlreadyStopping = isStopping && searchResult.status === "ON";
  const isAlreadyStarting = isStarting && searchResult.status === "ON";

  const getTintColor = (status: string): Color => {
    switch (status) {
      case "ON":
        return Color.Green;
      case "OFF":
        return Color.Red;
      default:
        return Color.Yellow;
    }
  };

  return (
    <List.Item
      title={searchResult.name}
      subtitle={searchResult.status}
      icon={{ source: Icon.Circle, tintColor: getTintColor(searchResult.status) }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {isOffStatus && !isAlreadyStarting && (
              <Action title="Start Workspace" onAction={startWorkspace} icon={Icon.Power} />
            )}
            {!isOffStatus && !isAlreadyStopping && (
              <Action title="Stop Workspace" onAction={stopWorkspace} icon={Icon.Power} />
            )}
            {!isOffStatus && !isAlreadyStopping && (
              <Action title="Rebuild Workspace" onAction={rebuildWorkspace} icon={Icon.RotateClockwise} />
            )}
          </ActionPanel.Section>
          {!isOffStatus && (
            <ActionPanel.Section>
              <Action title="Open in Local VS Code" onAction={openLocalVSC} icon={Icon.Code} shortcut={{ modifiers: ["cmd"], key: "1" }} />
              <Action.OpenInBrowser title="Open in Cloud VS Code" url={`https://embold.dev/app/code?workspaceId=${searchResult.id}`} icon={Icon.Cloud} shortcut={{ modifiers: ["cmd"], key: "2" }} />
              <Action.OpenInBrowser title="Open Cloud Terminal" url={`https://embold.dev/app/terminal?workspaceId=${searchResult.id}`} icon={Icon.Terminal} shortcut={{ modifiers: ["cmd"], key: "3" }} />
              <Action.OpenInBrowser title="Open Dev URL" url={`https://${searchResult.name}--${userName}.embold.dev`} shortcut={{ modifiers: ["cmd"], key: "4" }} />
            </ActionPanel.Section>
          )}
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Show Coder Dashboard" icon={Icon.AppWindowGrid3x3} url={`https://embold.dev/workspaces?workspace=${searchResult.id}`} shortcut={{ modifiers: ["cmd"], key: "5" }} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

async function parseFetchResponse(response: Response) {
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const json = await response.json();

  // Assuming the data you provided is an array of workspace objects
  return json.map((workspace: any) => ({
    id: workspace.id,
    name: workspace.name,
    status: workspace.provider_status.container_status,
    // Add the rest of the properties here based on the interface above
    // For example: image_id: workspace.image_id, image_tag: workspace.image_tag, etc.
  })) as SearchResult[];
}

interface SearchResult {
  id: string;
  name: string;
  status: string,
}
