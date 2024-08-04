import { ActionPanel, Action, Clipboard, Color, Detail, Icon, List, getPreferenceValues, openExtensionPreferences, showToast, Toast, open } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useEffect, useState } from "react";
import { filter } from 'lodash';
import fetch, { RequestInit } from "node-fetch";
import { exec } from "child_process";

export interface Preferences {
  token: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [environments, setEnvironments] = useState<SearchResult[]>([]);

  const preferences = getPreferenceValues<Preferences>();

  const token = preferences.token;

  if (!token) {
    return (
      <Detail
        markdown="WP Haven requires a token to be set in the preferences. [Open preferences](command://raycast.preferences?commandId=wp-haven.preferences)"
        actions={
          <ActionPanel>
            <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
          </ActionPanel>
        }
      />
    );
  }

  // Fetch the list of environments
  const fetchEnvironments = async (): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`https://webapp--main--wphaven--xan.embold.dev/api/v1/raycast/environments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch environments.");
      }

      const json = (await response.json()) as any[];

      return json.map((environment: any) => ({
        id: environment.id,
        name: environment.domain,
        stage: environment.stage,
        dashboard: environment.dashboard,
        git: environment.git,
      })) as SearchResult[];
    } catch (error) {
      console.error("Error fetching environments:", error);
      return [];
    }
  };

  const refreshEnvironments = async () => {
    try {
      const updatedEnvironments = await fetchEnvironments();
      setEnvironments(updatedEnvironments);
    } catch (error) {
      console.error("Error refreshing environments:", error);
    }
  };

  // Initial fetch of workspaces on component mount
  useEffect(() => {
    refreshEnvironments();
  }, []);

  // Refresh the workspaces every 10 seconds
  useEffect(() => {
    const interval = setInterval(refreshEnvironments, 10000);

    // Clean up the interval when the component is unmounted
    return () => clearInterval(interval);
  }, []);

  // Filter the data based on the searchText
  const filteredData = searchText
    ? filter(environments, (environment) => environment.name.includes(searchText))
    : environments;


  return (
    <List
      isLoading={filteredData.length === 0}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search workspaces.."
      throttle
    >
      <List.Section title="Workspaces" subtitle={filteredData?.length + ""}>
        {filteredData?.map((searchResult) => (
          <SearchListItem key={searchResult.name} searchResult={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ searchResult }: { searchResult: SearchResult }) {
  const preferences = getPreferenceValues<Preferences>();

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isGeneratingVsCode, setIsGeneratingVsCode] = useState(false);

  const [isGeneratingSsh, setIsGeneratingSsh] = useState(false);

  const [isClearingCache, setIsClearingCache] = useState(false);

  const magicLogin = () => {
    // Set a state variable to indicate that the API call should start
    setIsLoggingIn(true);
  };

  const vsCodeLink = () => {
    // Set a state variable to indicate that the API call should start
    setIsGeneratingVsCode(true);
  };

  const sshLink = () => {
    // Set a state variable to indicate that the API call should start
    setIsGeneratingSsh(true);
  };

  const clearCache = () => {
    // Set a state variable to indicate that the API call should start
    setIsClearingCache(true);
  };

  useEffect(() => {
    // Define an async function to make the API call
    const startLoggingIn = async () => {
      try {
        await showToast({
          style: Toast.Style.Animated,
          title: "Generating magic login."
        });

        const url = `https://webapp--main--wphaven--xan.embold.dev/api/v1/raycast/environments/${searchResult.id}/magic-login`;

        // API key from preferences
        const preferences = getPreferenceValues<Preferences>();
        const token = preferences.token;

        // Fetch options
        const options: RequestInit = {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        } as RequestInit;

        const response = await fetch(url, options);

        const output = (await response.json()) as HavenResponse;

        if (!response.ok) {
          // Handle error response
          console.error("Failed to generate magic login.");

          await showToast({
            style: Toast.Style.Failure,
            title: "Failed. Ensure WPHaven Connect plugin active."
          });
        } else {
          await showToast({
            style: Toast.Style.Success,
            title: "Magic login generated."
          });

          open(output.link ?? '');
        }

        setIsLoggingIn(false);
      } catch (error) {
        console.error("Error while generating the magic login:", error);
        setIsLoggingIn(false);
      }
    };

    // Check if the API call should be made
    if (isLoggingIn) {
      console.log('starting');

        startLoggingIn();
    }
  }, [isLoggingIn]);

  useEffect(() => {
    // Define an async function to make the API call
    const startVsCode = async () => {
      try {
        const url = `https://webapp--main--wphaven--xan.embold.dev/api/v1/raycast/environments/${searchResult.id}/vscode`;

        // API key from preferences
        const preferences = getPreferenceValues<Preferences>();
        const token = preferences.token;

        // Fetch options
        const options: RequestInit = {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        } as RequestInit;

        const response = await fetch(url, options);

        const output = (await response.json()) as HavenResponse;

        if (!response.ok) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Failed generating VS Code link."
          });
        } else {

          open(output.link ?? '');
        }

        setIsLoggingIn(false);
      } catch (error) {
        console.error("Error while opening vs code:", error);
        setIsLoggingIn(false);
      }
    };

    // Check if the API call should be made
    if (isGeneratingVsCode) {
      console.log('starting vs code link');

      startVsCode();
    }
  }, [isGeneratingVsCode]);

  useEffect(() => {
    // Define an async function to make the API call
    const startSsh = async () => {
      try {
        const url = `https://webapp--main--wphaven--xan.embold.dev/api/v1/raycast/environments/${searchResult.id}/ssh`;

        // API key from preferences
        const preferences = getPreferenceValues<Preferences>();
        const token = preferences.token;

        // Fetch options
        const options: RequestInit = {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        } as RequestInit;

        const response = await fetch(url, options);

        const output = (await response.json()) as HavenResponse;

        if (!response.ok) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Failed generating SSH link."
          });
        } else {

          open(output.link ?? '');
        }

        setIsGeneratingSsh(false);
      } catch (error) {
        console.error("Error while opening ssh:", error);
        setIsGeneratingSsh(false);
      }
    };

    // Check if the API call should be made
    if (isGeneratingSsh) {
      console.log('starting ssh link');

      startSsh();
    }
  }, [isGeneratingSsh]);

  useEffect(() => {
    // Define an async function to make the API call
    const startCacheClear = async () => {
      try {
        await showToast({
          style: Toast.Style.Animated,
          title: "Attempting to clear cache."
        });

        const url = `https://webapp--main--wphaven--xan.embold.dev/api/v1/raycast/environments/${searchResult.id}/cache`;

        // API key from preferences
        const preferences = getPreferenceValues<Preferences>();
        const token = preferences.token;

        // Fetch options
        const options: RequestInit = {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        } as RequestInit;

        const response = await fetch(url, options);

        const output = (await response.json()) as HavenResponse;

        if (!response.ok) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Failed clearing cache."
          });
        } else {
          await showToast({
            style: Toast.Style.Success,
            title: "All detected caches cleared."
          });
        }

        setIsClearingCache(false);
      } catch (error) {
        console.error("Error while clearing cache:", error);
        setIsClearingCache(false);
      }
    };

    // Check if the API call should be made
    if (isClearingCache) {
      console.log('starting ssh link');

      startCacheClear();
    }
  }, [isClearingCache]);

  const getTintColor = (stage: string): Color => {
    switch (stage) {
      case "production":
        return Color.Green;
      case "maintenance":
        return Color.Blue;
      default:
        return Color.Yellow;
    }
  };

  return (
    <List.Item
      title={searchResult.name}
      subtitle={searchResult.stage}
      icon={{ source: Icon.Globe, tintColor: getTintColor(searchResult.stage) }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
              <Action title="Magic Login" onAction={magicLogin} icon={Icon.Key} shortcut={{ modifiers: ["cmd"], key: "1" }} />
              <Action.OpenInBrowser title="Frontend" icon={Icon.House} url={`${searchResult.name}`} shortcut={{ modifiers: ["cmd"], key: "2" }} />
          </ActionPanel.Section>
        <ActionPanel.Section>
            <Action title="VS Code" onAction={vsCodeLink} icon={Icon.Code} shortcut={{ modifiers: ["cmd"], key: "3" }} />
            <Action title="Terminal" onAction={sshLink} icon={Icon.Terminal} shortcut={{ modifiers: ["cmd"], key: "4" }} />
            <Action.OpenInBrowser title="GitHub" icon={Icon.Dna} url={`${searchResult.git}`} shortcut={{ modifiers: ["cmd"], key: "5" }} />
            <Action title="Clear Cache" onAction={clearCache} icon={Icon.Trash} shortcut={{ modifiers: ["cmd"], key: "6" }} />
        </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="WP Haven Dashboard" icon={Icon.AppWindowSidebarLeft} url={`${searchResult.dashboard}`} shortcut={{ modifiers: ["cmd"], key: "7" }} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

interface SearchResult {
  id: string;
  name: string;
  stage: string,
  dashboard: string,
  git: string,
}

interface HavenResponse {
    link?: string;
    message?: string;
  }
